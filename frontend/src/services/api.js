import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
const VERIFY_API = process.env.REACT_APP_VERIFY_API || 'http://localhost:5000/verify';

export const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export async function verifyTokenOnServer(token) {
  // Calls backend public verify endpoint
  const url = `${VERIFY_API}?token=${encodeURIComponent(token)}`;
  return axios.get(url);
}
