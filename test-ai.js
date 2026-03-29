const fetch = require('node-fetch'); // wait run in bun or node 18+ has fetch
const url = 'https://ejufjwtpzusgjyhqcsxz.supabase.co/functions/v1/trigger-ai-feedback';
const key = 'sb_publishable_ruDhgn6hl54KbNeebLZAmg_60oO18rG'; // The ANON KEY from .env

(async () => {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        image_1: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        image_2: null,
        missionName: 'Test'
      })
    });
    const text = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', text);
  } catch (e) {
    console.error('Error:', e);
  }
})();
