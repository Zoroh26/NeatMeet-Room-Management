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
       
       const isProduction = process.env.NODE_ENV === 'production';
       
       const smtpConfig = {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: {
                rejectUnauthorized: isProduction,
                ciphers: isProduction ? undefined : 'SSLv3'
            },
            // Production-optimized timeouts
            connectionTimeout: isProduction ? 30000 : 60000,  // 30s prod, 60s dev
            greetingTimeout: isProduction ? 15000 : 30000,    // 15s prod, 30s dev  
            socketTimeout: isProduction ? 30000 : 60000,      // 30s prod, 60s dev
            pool: isProduction,                               // Use connection pooling in production
            maxConnections: isProduction ? 5 : 1,            // Max 5 connections in prod
            maxMessages: isProduction ? 100 : 1,             // Reuse connections in prod
            debug: !isProduction && process.env.SMTP_DEBUG === 'true'
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
            console.log('🔍 Testing SMTP connection...');
            await this.transporter.verify();
            console.log("✅ SMTP connection verified successfully");
        }
        catch(error:any){
            console.error("❌ SMTP connection failed:", error.message);
            console.error("❌ Full error details:", error);
            
            // Provide specific troubleshooting based on error type
            if (error.message.includes('timeout')) {
                console.error('🔧 Timeout Fix: Check firewall, try port 465 with secure:true, or use app-specific password');
            }
            if (error.message.includes('authentication')) {
                console.error('🔧 Auth Fix: Enable "Less secure apps" or use App Password for Gmail');
            }
            if (error.message.includes('ENOTFOUND')) {
                console.error('🔧 DNS Fix: Check SMTP_HOST spelling and internet connection');
            }
        }
    }

    // Async method that doesn't block user creation
    async sendWelcomeEmailAsync(user:any, temporaryPassword:string){
        // Don't await - fire and forget in production
        if (process.env.NODE_ENV === 'production') {
            setImmediate(() => this.sendWelcomeEmail(user, temporaryPassword));
            console.log(`📧 Welcome email queued for ${user.email} (async)`);
            return { queued: true, email: user.email };
        }
        // In development, send synchronously for debugging
        return await this.sendWelcomeEmail(user, temporaryPassword);
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
            
            // Set timeout for email sending in production
            const emailTimeout = process.env.NODE_ENV === 'production' ? 30000 : 60000;
            
            const result = await Promise.race([
                this.transporter.sendMail(mailOptions),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Email timeout')), emailTimeout)
                )
            ]);
            
            console.log(`✅ Welcome email sent successfully to ${user.email}. MessageId: ${(result as any).messageId}`);
            return result;
        }catch(error:any){
            console.error(`❌ Failed to send welcome email to ${user.email}:`, error.message);
            console.error('Full error:', error);
            
            // In production, don't throw error to avoid blocking user creation
            if (process.env.NODE_ENV === 'production') {
                console.log('🚨 Production mode: User creation will proceed despite email failure');
                return null;
            }
            throw new Error("Failed to send welcome email")
        }
    }
}

export const emailService = new EmailService();