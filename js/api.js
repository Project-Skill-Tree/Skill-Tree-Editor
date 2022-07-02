async function getAllNodes() {
    var api_url;
    try {
        api_url = new URL(window.localStorage.getItem('api_url'));
    }
    catch {
        showError('Invalid API URL');
        return;
    }
    if(!api_url.hostname) {
        showError('API URL is invalid or missing');
        return;
    }
    let api_key = window.localStorage.getItem('api_key');

    console.log(`${api_url.origin}/v1/getNodes`)

    let tree = await fetch(`${api_url.origin}/v1/getNodes`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'api_key': api_key
        }
    }).catch(function(error) {
        showError(error);
    });

    if(!tree) {
        return;
    }

    return tree.json();
}

function formatAPIToEditor(data) {
    let result = [];
    delete data.response;

    // remove the "root" field
    delete data.root;

    Object.keys(data).forEach(function(key) {
        let type = data[key];

        type.forEach(function(item) {
            item.type = key;
            item.id = item._id;
            delete item._id;
            delete item.__v;
            if(!item.requires || item.requires.length < 1) item.isRoot = true;
            result.push(item);
        });
    });
    
    return result;
}

async function updateTree(tree) {
    let spinner = document.getElementById('spinner');
    spinner.style.display = 'flex';
    let duplicateNodes = findDuplicateNodes(tree);
    if(duplicateNodes.length > 0) {
        showError(`There are duplicate skill nodes with the same title and level. \n${duplicateNodes.join(',').replaceAll('-', ' ')}`);
        return;
    }

    let newNodes = tree.filter(node => node.id.startsWith('IR'));

    let newTree = await replaceIntermediateReferences(newNodes);
    if(newTree === false) {
        return;
    }

    if(oldTree && oldTree.length > 0) newTree = findAllChangedNodes(oldTree, newTree);

    newTree = await newTree.filter(node => !node.id.startsWith('IR'));

    newTree.forEach(node => {
        let method = 'PUT';
        let endpoint = (node.type[0].toUpperCase() + node.type.slice(1)).slice(0, -1);
        let url = `${window.localStorage.getItem('api_url')}/v1/${node.type}/update${endpoint}`;
        console.log(url)
        let headers = new Headers();
        headers.append('api_key', window.localStorage.getItem('api_key'));
        headers.append('Content-Type', 'application/json');

        delete node.isNew;
        delete node.isRoot;

        fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(node)
        });
    });

    spinner.style.display = 'none';
}

// Sort the nodes by the requirement ID, ones without a requirement ID go first, then go the ones with a normal ID and lastly the ones with a requirement that starts with IR
function sortTree() {
    let tree = structuredClone(oldTree);
    tree.sort((a, b) => {
        if(!a.requires || a.requires.length < 1) return -1;
        if(!b.requires || b.requires.length < 1) return 1;
        if(a.requires[0].startsWith('IR')) return -1;
        if(b.requires[0].startsWith('IR')) return 1;
        return 0;
    });
    return tree;
}

async function replaceIntermediateReferences(tree) {
    // for each item that has an intermediate reference, send it to the server and replace the reference with the new id
    let changedNodes = structuredClone(tree);
    // if(oldTree && oldTree.length > 0) changedNodes = findAllChangedNodes(oldTree, newTree);
    console.log(changedNodes)
    // changedNodes.sort((a, b) => {
    //     return (a.requires ? a.requires.length : 0) - (b.requires ? b.requires.length : 0);
    // });

    let method = 'POST';

    // sort the nodes by amount of requires to make sure we send the root nodes first if there are any new ones
    changedNodes.sort((a, b) => {
        return (a.requires ? a.requires.length : 0) - (b.requires ? b.requires.length : 0);
    });
    
    for(var i = 0; i < changedNodes.length; i++) {
        node = changedNodes[i];
        let endpoint = (node.type[0].toUpperCase() + node.type.slice(1)).slice(0, -1);
        let url = `${window.localStorage.getItem('api_url')}/v1/${node.type}/create${endpoint}`;
        console.log(url)
        let headers = new Headers();
        headers.append('api_key', window.localStorage.getItem('api_key'));
        headers.append('Content-Type', 'application/json');

        delete node.isNew;
        delete node.isRoot;

        let response = await fetch(url, {
            method: method,
            headers: headers,
            body: JSON.stringify(node)
        })

        
        response = await response.json();
        console.log(response)
        if(response.response !== 'success') {
            showError(`Error creating ${node.type}. Response: ${JSON.stringify(response.error)}`);
            return false;
        }
        let responseID = response[node.type.slice(0, -1)]["_id"];
        
        if(!responseID) {
            showError('Error creating node \n Some nodes may not have been created.');
            return;
        }
        let newTree = await replaceID(changedNodes, node.id, responseID);
        changedNodes = newTree;
    }

    return tree;
}

function findDuplicateNodes(tree) {
    // check if there are any two nodes with the same title and level combo
    let nodeIds = [];
    nodeIds = tree.map(node => node.type == "skills" ? node.title + "-" + node.level : false).filter(node => node);

    let duplicates = nodeIds.filter((item, index) => {
        return nodeIds.indexOf(item) !== index;
    });

    return [...new Set(duplicates)];
}
