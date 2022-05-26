async function getTree() {
    try {
    // gets the JSON object with a list of skills from the API
        const tree = fetch(`${localStorage.getItem('API_URL')}skills`, {
            method: 'GET',
            headers: {
                api_key: localStorage.getItem('API_KEY')
            }
        })
            .then(response => json = response.json())
            .then(json => {
                localStorage.setItem('tree', JSON.stringify(json));
            });
    }
    catch(error) {
        console.log(error);
    }   
}