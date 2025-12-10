import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, message } = await request.json();

    // Validate required fields
    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Create transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: 'khamareclarke@gmail.com',
        pass: 'ovga hgzy rltc ifyh',
      },
    });

    // Internal notification email to AdsStarter team
    const internalMailOptions = {
      from: `"AdsStarter Team" <khamareclarke@gmail.com>`,
      to: 'khamareclarke@gmail.com',
      subject: `🚀 New Lead: ${name} - AdsStarter Lead Capture`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚀 New Lead Captured!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">AdsStarter Lead Capture Form</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #00c6ff; padding-bottom: 10px;">Lead Information</h2>
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #555; display: block; margin-bottom: 5px;">👤 Full Name:</strong>
              <p style="margin: 0; color: #333; font-size: 16px;">${name}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #555; display: block; margin-bottom: 5px;">📧 Email Address:</strong>
              <p style="margin: 0; color: #333; font-size: 16px;">
                <a href="mailto:${email}" style="color: #00c6ff; text-decoration: none;">${email}</a>
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <strong style="color: #555; display: block; margin-bottom: 5px;">📞 Phone Number:</strong>
              <p style="margin: 0; color: #333; font-size: 16px;">
                <a href="tel:${phone}" style="color: #00c6ff; text-decoration: none;">${phone}</a>
              </p>
            </div>
            
            ${message ? `
            <div style="margin-bottom: 20px;">
              <strong style="color: #555; display: block; margin-bottom: 5px;">💬 Message:</strong>
              <p style="margin: 0; color: #333; font-size: 16px; background: #f8f9fa; padding: 15px; border-radius: 5px; border-left: 4px solid #00c6ff;">${message}</p>
            </div>
            ` : ''}
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #00c6ff;">
              <h3 style="color: #333; margin-top: 0;">Next Steps:</h3>
              <ul style="color: #555; margin: 0; padding-left: 20px;">
                <li>Contact the lead within 24 hours</li>
                <li>Schedule a strategy call</li>
                <li>Add to CRM system</li>
                <li>Follow up with email sequence</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                Lead captured on ${new Date().toLocaleString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Confirmation email to the lead
    const confirmationMailOptions = {
      from: `"AdsStarter Team" <khamareclarke@gmail.com>`,
      to: email,
      subject: `Thank you for your interest! - AdsStarter`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8f9fa; padding: 20px;">
          <div style="background: linear-gradient(135deg, #00c6ff 0%, #0072ff 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🚀 Thank You, ${name}!</h1>
            <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">We've received your request</p>
          </div>
          
          <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin-top: 0; border-bottom: 2px solid #00c6ff; padding-bottom: 10px;">What Happens Next?</h2>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #00c6ff; margin-bottom: 10px;">📞 We'll Contact You Soon</h3>
              <p style="color: #555; margin: 0; font-size: 16px; line-height: 1.6;">
                Our team will reach out to you within 24 hours to discuss your business goals and how we can help you scale with high-converting ad campaigns.
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #00c6ff; margin-bottom: 10px;">🎯 Free Strategy Call</h3>
              <p style="color: #555; margin: 0; font-size: 16px; line-height: 1.6;">
                We'll analyze your current setup and create a custom growth plan tailored to your business needs.
              </p>
            </div>
            
            <div style="margin-bottom: 20px;">
              <h3 style="color: #00c6ff; margin-bottom: 10px;">📧 Stay Connected</h3>
              <p style="color: #555; margin: 0; font-size: 16px; line-height: 1.6;">
                In the meantime, feel free to reach out to us at <a href="mailto:admin@adsstarter.com" style="color: #00c6ff; text-decoration: none;">admin@adsstarter.com</a> or call us at <a href="tel:519400200" style="color: #00c6ff; text-decoration: none;">(519)-400-200</a>.
              </p>
            </div>
            
            <div style="background: #e8f4fd; padding: 20px; border-radius: 8px; margin-top: 30px; border-left: 4px solid #00c6ff;">
              <h3 style="color: #333; margin-top: 0;">Why Choose AdsStarter?</h3>
              <ul style="color: #555; margin: 0; padding-left: 20px;">
                <li>325+ successful client campaigns</li>
                <li>Proven 3-step launch method</li>
                <li>24/7 support and optimization</li>
                <li>ROI guarantee on Empire plan</li>
              </ul>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; margin: 0; font-size: 14px;">
                Best regards,<br>
                <strong style="color: #00c6ff;">The AdsStarter Team</strong>
              </p>
            </div>
          </div>
        </div>
      `,
    };

    // Send internal notification email
    await transporter.sendMail(internalMailOptions);

    // Send confirmation email to the lead
    await transporter.sendMail(confirmationMailOptions);

    // Also send to booking email
    const bookingMailOptions = {
      ...internalMailOptions,
      to: 'khamareclarke@gmail.com',
      subject: `Booking Request: ${name} - AdsStarter`,
    };

    await transporter.sendMail(bookingMailOptions);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error sending email:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
