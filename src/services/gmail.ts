// Función para codificar en base64 URL-safe con soporte UTF-8
function encodeBase64URLSafe(str: string): string {
  try {
    // Usar TextEncoder para manejar UTF-8 correctamente
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    
    // Convertir bytes a string binario
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    // Codificar en base64 estándar y convertir a URL-safe
    const base64 = btoa(binary);
    return base64
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (error) {
    console.error('Error encoding base64:', error);
    // Fallback: usar btoa directamente (puede fallar con UTF-8)
    return btoa(str)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

export async function sendGmailMessage(accessToken: string, to: string, subject: string, body: string) {
  // Construir el email con formato RFC 2822
  const emailLines = [
    `To: ${to}`,
    `Subject: ${subject}`,
    'Content-Type: text/html; charset=UTF-8',
    'MIME-Version: 1.0',
    '',
    body,
  ];
  
  const email = emailLines.join('\r\n');
  
  // Codificar en base64 URL-safe
  const encodedEmail = encodeBase64URLSafe(email);

  try {
    const response = await fetch('https://www.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        raw: encodedEmail,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: 'Unknown error' } }));
      console.error('Gmail API Error Response:', errorData);
      throw new Error(errorData.error?.message || `HTTP ${response.status}: Failed to send Gmail message`);
    }
    
    const result = await response.json();
    console.log('Email sent successfully:', result);
    return result;
  } catch (error: any) {
    console.error('Error sending email:', error);
    // Re-lanzar el error con más contexto
    if (error.message) {
      throw error;
    }
    throw new Error('Failed to send email. Please check your connection and try again.');
  }
}
