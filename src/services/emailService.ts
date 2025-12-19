import emailjs from 'emailjs-com';

// Initialize EmailJS with your public key
emailjs.init('sYfnZeIDOxAl4y-r9');

export interface EmailTemplateParams {
  order_number: string;
}

export const sendOrderEmail = async (templateParams: EmailTemplateParams): Promise<void> => {
  try {
    const response = await emailjs.send(
      'service_pvd829d',
      'template_myzm85l', // You'll need to create this template in EmailJS
      templateParams as any,
      'sYfnZeIDOxAl4y-r9'
    );
    
    console.log('Email sent successfully:', response);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 