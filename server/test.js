import FormData from 'form-data';

async function testUpload() {
  // Create a 1x1 dummy image buffer (JPEG)
  const dummyImage = Buffer.from('/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=', 'base64');
  
  const form = new FormData();
  form.append('image', dummyImage, { filename: 'test.jpg', contentType: 'image/jpeg' });
  
  try {
    const res = await fetch('http://localhost:5000/api/sanitation/scan', {
      method: 'POST',
      body: form,
      headers: form.getHeaders ? form.getHeaders() : {}
    });
    console.log('Status:', res.status);
    console.log('Body:', await res.text());
  } catch (err) {
    console.error('Fetch error:', err);
  }
}
testUpload();
