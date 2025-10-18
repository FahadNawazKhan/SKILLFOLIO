const Activity = require('../models/Activity');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

exports.createActivity = async (req, res) => {
  try {
    const data = req.body;
    const activity = new Activity(data);
    await activity.save();
    res.status(201).json(activity);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPendingActivities = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const activities = await Activity.find({ status }).sort({ createdAt: -1 }).limit(200);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, moderator, comment } = req.body; // action: 'approved'|'rejected'

    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const activity = await Activity.findById(id);
    if (!activity) return res.status(404).json({ error: 'Activity not found' });

    activity.status = action;
    activity.moderator = moderator || activity.moderator;
    activity.comment = comment || activity.comment;
    activity.verifiedAt = new Date();
    await activity.save();

    if (action === 'approved') {
      // Sign a JWT (HS256 for demo)
      const payload = {
        iss: process.env.ISS || 'http://localhost:5000',
        sub: `student:${activity.student_id}`,
        jti: `activity:${activity._id}`,
        vc: {
          type: ['VerifiableCredential', 'StudentActivityCredential'],
          credentialSubject: {
            student_id: activity.student_id,
            name: activity.student_name,
            activity: {
              title: activity.title,
              date: activity.date,
              hours: activity.hours,
              description: activity.description,
              evidence_url: activity.evidence_url
            },
            verified_by: { name: moderator },
            verified_at: new Date().toISOString()
          }
        }
      };
      const secret = process.env.JWT_SECRET || 'dev-secret';
      const token = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '365d' });

      // Generate simple PDF (async write, not blocking response)
      const pdfDir = path.join(__dirname, '..', '..', 'public', 'pdfs'); // project-root/public/pdfs
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });
      const pdfPath = path.join(pdfDir, `${activity._id}.pdf`);
      const doc = new PDFDocument();
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);
      doc.fontSize(16).text('Skillfolio Credential', { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Student: ${activity.student_name} (${activity.student_id})`);
      doc.text(`Title: ${activity.title}`);
      doc.text(`Date: ${activity.date ? activity.date.toISOString().slice(0,10) : '-'}`);
      doc.text(`Hours: ${activity.hours}`);
      doc.moveDown();
      doc.text(`Verified by: ${moderator}`);
      doc.end();

      // wait for file to finish writing before returning url (optional)
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      activity.pdfUrl = `/public/pdfs/${activity._id}.pdf`;
      activity.jwt = token;
      await activity.save();

      return res.json({ success: true, pdfUrl: activity.pdfUrl, token });
    }

    // if rejected
    return res.json({ success: true, message: `Activity ${action}` });

  } catch (err) {
    console.error('verifyActivity error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};
