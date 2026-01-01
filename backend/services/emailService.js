const nodemailer = require('nodemailer');

// Configuration SMTP (Gmail, Outlook, ou autre)
// Idéalement, utilisez des variables d'environnement
const transporter = nodemailer.createTransport({
  service: 'gmail', // ou host: 'smtp.example.com'
  auth: {
    user: process.env.EMAIL_USER || 'nutriplus.alerts@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
});

const sendErrorEmail = async (error, context = {}) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'abachyouness@gmail.com';

  try {
    const { user, filter, route } = context;

    const subject = `🚨 ALERTE BUG: ${error.message || 'Erreur inconnue'}`;
    const html = `
      <h2>⚠️ Exception Détectée</h2>
      <p><strong>Message:</strong> ${error.message}</p>
      <p><strong>Stack:</strong> <pre>${error.stack}</pre></p>
      
      <h3>📋 Contexte</h3>
      <ul>
        <li><strong>Utilisateur:</strong> ${user ? `${user.name} (${user.email})` : 'Anonyme'}</li>
        <li><strong>Filtre/Recherche:</strong> ${filter ? JSON.stringify(filter) : 'N/A'}</li>
        <li><strong>Route:</strong> ${route || 'N/A'}</li>
        <li><strong>Date:</strong> ${new Date().toLocaleString()}</li>
      </ul>
    `;

    await transporter.sendMail({
      from: '"NutriPlus Bot" <no-reply@nutriplus.app>',
      to: adminEmail,
      subject: subject,
      html: html
    });

    console.log(`📧 Email d'erreur envoyé à ${adminEmail}`);
  } catch (emailError) {
    console.error('❌ Echec envoi email alerte:', emailError.message);
  }
};

module.exports = { sendErrorEmail };
