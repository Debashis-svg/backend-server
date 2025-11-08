// server/services/judge0Service.js
const axios = require('axios');

const judge0Api = axios.create({
  baseURL: `https://${process.env.JUDGE0_API_HOST}`,
  headers: {
    'X-RapidAPI-Key': process.env.JUDGE0_API_KEY,
    'X-RapidAPI-Host': process.env.JUDGE0_API_HOST,
    'Content-Type': 'application/json',
  },
});

// Map our language names to Judge0's language IDs
const languageMap = {
  javascript: 93,
  python: 71,
  java: 62,
  cpp: 54,
};

// --- NEW HELPER FUNCTIONS ---
// Encodes a string to Base64
const encode = (str) => Buffer.from(str, 'utf-8').toString('base64');
// Decodes a Base64 string
const decode = (str) => (str ? Buffer.from(str, 'base64').toString('utf-8') : null);
// ----------------------------

/**
 * Submits code to Judge0 for execution
 * @param {string} code - The user's source code
 * @param {string} language - The language (e.g., 'python')
 * @param {string} input - The standard input for the code
 * @param {string} expectedOutput - The expected output
 * @returns {object} - A promise that resolves to a result object
 */
const submitCode = async (code, language, input, expectedOutput) => {
  const languageId = languageMap[language] || 54; // Default to C++

  try {
    // 1. Create a submission with Base64 encoded data
    const payload = {
      source_code: encode(code),
      language_id: languageId,
      stdin: encode(input),
      expected_output: encode(expectedOutput),
    };
    
    // Add base64_encoded=true to the URL
    const response = await judge0Api.post('/submissions?base64_encoded=true', payload);

    const token = response.data.token;
    if (!token) {
      throw new Error('Failed to get submission token');
    }

    // 2. Poll for the result
    let result;
    while (true) {
      // Add base64_encoded=true to the GET request as well
      const resultResponse = await judge0Api.get(`/submissions/${token}?base64_encoded=true`);
      const statusId = resultResponse.data.status.id;

      if (statusId > 2) { // 1 = In Queue, 2 = Processing
        result = resultResponse.data;
        break;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // 3. Format and DECODE the result
    return {
      status: result.status.description,
      isCorrect: result.status.id === 3, // 3 = Accepted
      // Decode the output fields
      output: decode(result.stdout) || decode(result.stderr) || decode(result.compile_output),
    };

  } catch (error) {
    console.error('Judge0 API Error:', error.response ? error.response.data : error.message);
    return {
      status: 'Error',
      isCorrect: false,
      output: error.message,
    };
  }
};

/**
 * Runs code against multiple test cases
 * @param {string} code - User's source code
 * @param {string} language - 'python', 'cpp', etc.
 * @param {Array} testCases - Array of { input, expectedOutput }
 */
exports.evaluate = async (code, language, testCases) => {
  let passedCount = 0;
  let outputs = [];
  let status = "Accepted"; // Assume success until a failure
  let message = "";

  for (const [index, tc] of testCases.entries()) {
    const result = await submitCode(code, language, tc.input, tc.expectedOutput);
    outputs.push(`Test Case ${index + 1}: ${result.status}\nOutput:\n${result.output}\n`);

    if (result.isCorrect) {
      passedCount++;
    } else {
      status = result.status; // Set status to the first failure
      message = `Failed on Test Case ${index + 1}.`;
      break; // Stop on first failure
    }
  }

  if (status === "Accepted") {
    message = `Passed ${passedCount}/${testCases.length} test cases.`;
  }

  // Calculate score (simple percentage)
  const score = (passedCount / testCases.length) * 100;

  return {
    status,
    isCorrect: passedCount === testCases.length,
    message,
    outputs,
    score: isNaN(score) ? 0 : score, // Handle division by zero
  };
};