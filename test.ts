import { generateStudyContent } from './services/ai.ts';

async function test() {
  try {
    const res = await generateStudyContent('here is some test text about photosynthesis and cell biology for the neet exam.');
    console.log('SUCCESS:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('ERROR:', err);
  }
}
test();
