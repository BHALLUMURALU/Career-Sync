const { GoogleGenerativeAI } = require("@google/generative-ai");
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const parseEmailWithAI = async (emailText) => {
    const prompt = `Return ONLY a JSON object extracting data from this email. 

1.STRICT BRANCH MAPPING RULES:
You must map any mentioned branches to these EXACT codes only: [CSE, AI&DS, ECE, EEE, MECH, CIVIL,Computer Applications,Business Administration,Computer Science,Mobile Communication,Automobile Servicing].
Use the following logic for mapping:
- If you see "IT", "Information Technology", "Computer Science", "CSE", "Computer Science Engineering", or "Computer Science and Engineering" -> Map to "CSE".
- If you see "AI", "Data Science", "Artificial Intelligence", "AI&DS", or "AIDS" -> Map to "AI&DS".
- If you see "Electronics", "Communication",Electronics and Communication, or "ECE" -> Map to "ECE".
- If you see "Electrical" or "EEE" -> Map to "EEE".
- If you see "Mechanical","mech", or "MECH"  -> Map to "MECH".
- If you see "Civil" -> Map to "CIVIL".
Logic for Other Degrees:
   - If Course is B.C.A or M.C.A -> Branch is "Computer Applications"
   - If Course is B.B.A or M.B.A -> Branch is "Business Administration"
   - If Course is M.Tech or Diploma-CSE(VCS) -> Branch is "Computer Science"
   - If Course is Diploma-ECE(VMC) -> Branch is "Mobile Communication"
   - If Course is Diploma-ME(VAS) -> Branch is "Automobile Servicing"
2.drive_year EXTRACTION:
- Extract the drive year from the drive_date field.
- If the drive_date is in the year 2024, set drive_year to 2024, and so on.
- Extract the drive_year as number type.

If a branch mentioned in the email does not fit these categories, do not include it.

Structure: {
  "drive": {
    "company_name": "string", 
    "location": "string", 
    "drive_date": "YYYY-MM-DD", 
    "min_cgpa": number, 
    "max_backlogs": number,
    drive_year: number
  },
  "eligible_branches": ["string"],
  "roles": [
    {
      "role_title": "string", 
      "job_type": "string", 
      "salary_package": "string", 
      "skills_required": "string"
    }
  ]
}

Email: ${emailText}`;

    try {
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });
        const result = await model.generateContent(prompt);
        return JSON.parse(result.response.text());
    } catch (error) {
        console.error("AI Error, attempting fallback:", error.message);
        try {
            const legacyModel = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
            const result = await legacyModel.generateContent(prompt);
            const text = result.response.text().replace(/```json|```/g, "").trim();
            return JSON.parse(text);
        } catch (err) {
            console.error("All AI models failed.");
            return null;
        }
    }
};

module.exports = { parseEmailWithAI };