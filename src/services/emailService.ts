import axios from 'axios';
import { API_BASE_URL } from '../api';

export interface EmailTemplateParams {
  order_number: string;
  to: string; // Recipient email address
  subject?: string;
  html?: string;
  text?: string;
}

export const sendOrderEmail = async (templateParams: EmailTemplateParams): Promise<void> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/.netlify/functions/sendemail`,
      {
        to: templateParams.to,
        orderNumber: templateParams.order_number,
        subject: templateParams.subject,
        html: templateParams.html,
        text: templateParams.text,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
    
    console.log('Email sent successfully:', response.data);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}; 
