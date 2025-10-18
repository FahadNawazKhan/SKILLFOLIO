// backend/src/controllers/activitiesController.js
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
    console.error('createActivity error:', err);
    res.status(400).json({ error: err.message });
  }
};

exports.getPendingActivities = async (req, res) => {
  try {
    const status = req.query.status || 'pending';
    const activities = await Activity.find({ status }).sort({ createdAt: -1 }).limit(200);
    res.json(activities);
  } catch (err) {
    console.error('getPendingActivities error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.verifyActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, moderator, comment } = req.body; // action: 'approved'|'rejected'

    // Validate action
    if (!['approved', 'rejected'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    console.log('verifyActivity called', { id, action, moderator, hasComment: Boolean(comment) });

    // 1) Update status & metadata first (explicit update)
    const newStatus = action === 'approved' ? 'approved' : 'rejected';
    const updateFields = {
      status: newStatus,
      // only set fields if provided (avoid overwriting existing values with undefined)
      ...(moderator ? { moderator } : {}),
      ...(typeof comment !== 'undefined' ? { comment } : {}),
      verifiedAt: new Date()
    };

    // Use findByIdAndUpdate to get updated doc back
    const updatedActivity = await Activity.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updatedActivity) {
      console.warn('Activity not found for id:', id);
      return res.status(404).json({ error: 'Activity not found' });
    }

    console.log('After status update (db):', {
      id: updatedActivity._id,
      status: updatedActivity.status,
      moderator: updatedActivity.moderator,
    });

    // Prepare return values
    let pdfUrl = null;
    let token = null;

    // 2) If approved → sign JWT, generate PDF, persist pdfUrl & jwt
    if (action === 'approved') {
      // Build credential payload
      const payload = {
        iss: process.env.ISS || 'http://localhost:5000',
        sub: `student:${updatedActivity.student_id}`,
        jti: `activity:${updatedActivity._id}`,
        iat: Math.floor(Date.now() / 1000),
        vc: {
          type: ['VerifiableCredential', 'StudentActivityCredential'],
          credentialSubject: {
            student_id: updatedActivity.student_id,
            name: updatedActivity.student_name,
            activity: {
              title: updatedActivity.title,
              date: updatedActivity.date || null,
              hours: updatedActivity.hours || null,
              description: updatedActivity.description || null,
              evidence_url: updatedActivity.evidence_url || null
            },
            verified_by: { name: moderator || updatedActivity.moderator || 'Unknown' },
            verified_at: new Date().toISOString()
          }
        }
      };

      // Sign token (HS256 dev default; in prod use RS256 + KMS)
      const secret = process.env.JWT_SECRET || 'dev-secret';
      token = jwt.sign(payload, secret, { algorithm: 'HS256', expiresIn: '365d' });

      // Ensure pdf directory exists (relative to controllers folder)
      // structure: backend/public/pdfs
      const pdfDir = path.join(__dirname, '..', '..', 'public', 'pdfs');
      if (!fs.existsSync(pdfDir)) fs.mkdirSync(pdfDir, { recursive: true });

      const pdfPath = path.join(pdfDir, `${updatedActivity._id}.pdf`);

      // Generate PDF
      const doc = new PDFDocument({ autoFirstPage: true });
      const writeStream = fs.createWriteStream(pdfPath);
      doc.pipe(writeStream);

      // PDF content (change to your design as needed)
      doc.fontSize(18).text('Skillfolio Credential', { align: 'center' });
      doc.moveDown(1);
      doc.fontSize(12).text(`Student: ${updatedActivity.student_name || 'N/A'} (${updatedActivity.student_id || 'N/A'})`);
      doc.text(`Activity: ${updatedActivity.title || 'N/A'}`);
      doc.text(`Date: ${updatedActivity.date ? new Date(updatedActivity.date).toLocaleDateString() : '-'}`);
      doc.text(`Hours: ${updatedActivity.hours ?? '-'}`);
      doc.moveDown(0.5);
      doc.text(`Verified by: ${moderator || updatedActivity.moderator || 'N/A'}`);
      doc.text(`Verification Date: ${new Date().toLocaleString()}`);
      doc.moveDown(0.5);
      doc.text(`Comments: ${comment || (updatedActivity.comment || 'None')}`);
      doc.moveDown(1);
      doc.text('Verification token is embedded in system; scan the QR (if provided) to verify online.', { italic: true, size: 10 });
      doc.end();

      // Wait for file to finish writing
      await new Promise((resolve, reject) => {
        writeStream.on('finish', resolve);
        writeStream.on('error', reject);
      });

      pdfUrl = `/public/pdfs/${updatedActivity._id}.pdf`;

      // Persist pdfUrl and jwt into DB (explicit update)
      const finalActivity = await Activity.findByIdAndUpdate(
        id,
        { $set: { pdfUrl, jwt: token } },
        { new: true, runValidators: true }
      ).lean();

      console.log('After pdf/jwt save (db):', {
        id: finalActivity._id,
        pdfUrl: finalActivity.pdfUrl,
        jwtPresent: !!finalActivity.jwt
      });

      // Return final object
      return res.json({
        success: true,
        message: 'Activity approved and credential issued',
        pdfUrl,
        token,
        activity: finalActivity
      });
    }

    // 3) Rejected case — already updated status & comment
    return res.json({
      success: true,
      message: 'Activity rejected successfully',
      activity: updatedActivity
    });

  } catch (err) {
    console.error('verifyActivity error:', err);
    return res.status(500).json({
      error: 'Server error while verifying activity',
      details: err.message
    });
  }
};
