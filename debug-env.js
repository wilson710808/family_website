/**
 * Debug environment variables
 */
console.log('=== Environment Variables Debug ===');
console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? `${process.env.OPENAI_API_KEY.slice(0, 20)}...` : 'NOT DEFINED');
console.log('OPENAI_BASE_URL:', process.env.OPENAI_BASE_URL);
console.log('OPENAI_MODEL:', process.env.OPENAI_MODEL);
console.log('====================================');
