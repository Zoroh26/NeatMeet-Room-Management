import nodemailer from 'nodemailer'
const dotenv = require('dotenv');

// Ensure environment variables are loaded
dotenv.config();

class EmailService{
    public transporter: nodemailer.Transporter;

    constructor(){
       // Debug email configuration
       console.log('📧 Email Configuration:');
       console.log('   SMTP_HOST:', process.env.SMTP_HOST || 'NOT SET');
       console.log('   SMTP_PORT:', process.env.SMTP_PORT || 'NOT SET');
       console.log('   SMTP_SECURE:', process.env.SMTP_SECURE || 'NOT SET');
       console.log('   SMTP_USER:', process.env.SMTP_USER || 'NOT SET');
       console.log('   SMTP_PASS:', process.env.SMTP_PASS ? 'SET' : 'NOT SET');
       
       // Validate required environment variables
       if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
           console.error('❌ Missing required SMTP environment variables');
           throw new Error('Missing required SMTP configuration');
       }
       
       const smtpConfig = {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: false
            }
       };
       
       console.log('📧 Using SMTP Config:', {
           host: smtpConfig.host,
           port: smtpConfig.port,
           secure: smtpConfig.secure,
           user: smtpConfig.auth.user
       });
       
       this.transporter = nodemailer.createTransport(smtpConfig);
       this.verifyConnection();
    }

    private async verifyConnection(){
        try{
            await this.transporter.verify();
            console.log("✅ SMTP connection verified");
        }
        catch(error:any){
            console.error("❌ SMTP connection failed:", error.message);
        }
    }

    async sendWelcomeEmail (user:any,temporaryPassword:string){
        const mailOptions={
            from:process.env.SMTP_FROM,
            to:user.email,
            subject:"Welcome to NeatMeet",
            html:`
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2>Welcome to NeatMeet, ${user.name}!</h2>
                    <p>Your account has been created successfully. Here are your login credentials:</p>
                    
                    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
                        <h3>Login Credentials</h3>
                        <p><strong>Email:</strong> ${user.email}</p>
                        <p><strong>Temporary Password:</strong> ${temporaryPassword}</p>
                        <p><strong>Role:</strong> ${user.role}</p>
                    </div>
                    
                    <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <p><strong>🔒 Important Security Notice:</strong></p>
                        <p>This is a temporary password. For security reasons, you must change this password after your first login.</p>
                    </div>
                    
                    <p>You can login at: <a href="${process.env.FRONTEND_URL}/login">NeatMeet Login</a></p>
                    
                    <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                    <p style="color: #666; font-size: 14px;">
                        This email was sent from the NeatMeet system. If you didn't expect this email, please contact your administrator.
                    </p>
                </div>
            `,
            text: `
                Welcome to NeatMeet, ${user.name}!
                
                Your account has been created successfully. Here are your login credentials:
                
                Email: ${user.email}
                Temporary Password: ${temporaryPassword}
                Role: ${user.role}
                
                Important: This is a temporary password. You must change this password after your first login.
                
                You can login at: ${process.env.FRONTEND_URL}/login
            `
        }

        try {
            console.log(`📧 Attempting to send welcome email to ${user.email}...`);
            const result = await this.transporter.sendMail(mailOptions);
            console.log(`✅ Welcome email sent successfully to ${user.email}. MessageId: ${result.messageId}`);
            return result;
        }catch(error:any){
            console.error(`❌ Failed to send welcome email to ${user.email}:`, error.message);
            console.error('Full error:', error);
            throw new Error("Failed to send welcome email")
        }
    }
}

export const emailService = new EmailService();