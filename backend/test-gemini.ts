const key = 'AIzaSyBF8B3_F0D4u2jB7--5J7MGDRirpSZrZOU';

async function run() {
  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = (await res.json()) as { models: { name: string }[] };
    console.log(data.models.map(m => m.name));
  } catch (error) {
    console.error('Error:', error);
  }
}
run();
