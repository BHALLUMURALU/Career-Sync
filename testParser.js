const { parseEmailWithAI } = require('./geminiParser');

const sampleEmail = `
  Dear Placement Cell, 
  We are happy to announce a recruitment drive for Microsoft. 
  We are looking for Software Engineers for our Bangalore office. 
  The package is 18 LPA. Candidates must have a CGPA above 8.0. 
  The drive is scheduled for 2026-03-15.
`;

async function runTest() {
    console.log("Testing AI Parsing...");
    const result = await parseEmailWithAI(sampleEmail);
    console.log("AI Result:", JSON.stringify(result, null, 2));
}

runTest();