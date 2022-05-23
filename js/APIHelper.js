const axios = require("axios");

function getKey() {
    return process.env.API_KEY;
}

/**
 * Get JSON object containing skills from database
 */
exports.getSkills = function(callback) {
    axios.get(process.env.API_URL + "skills", {
        headers: {
            api_key: getKey()
        }
    }).then(res => {
        callback(res.data.root, res.data.skills);
    }).catch(res => {
        console.log(`Error fetching skills: ${res.status}`);
    });
};
