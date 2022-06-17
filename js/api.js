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
    let duplicateNodes = findDuplicateNodes(tree);
    if(duplicateNodes.length > 0) {
        showError(`There are duplicate nodes with the same title and level (shown as {type} {title} {level}). \n${duplicateNodes.join(',').replaceAll('-', ' ')}`);
        return;
    }
    let newTree = await replaceIntermediateReferences(tree);
    if(newTree === false) {
        return;
    }
    let changedNodes = findAllChangedNodes(oldTree, newTree);

    // check if there are any two nodes with the same title and level combo
    

    changedNodes.forEach(node => {
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
}

async function replaceIntermediateReferences(tree) {
    // for each item that has an intermediate reference, send it to the server and replace the reference with the new id
    let changedNodes = findAllChangedNodes(oldTree, tree).filter(node => node.id.startsWith('IR'));
    let method = 'POST';

    for(node of changedNodes) {
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
            showError(`Error creating ${node.type}. Response: ${response.error}`);
            return false;
        }
        responseID = response[node.type.slice(0, -1)]["_id"];
        
        if(!responseID) {
            showError('Error creating node \n Some nodes may not have been created.');
            return;
        }
        let newTree = await replaceID(tree, node.id, responseID);
        console.log(newTree);
        tree = newTree;
    }

    return tree;
}

function findDuplicateNodes(tree) {
    // check if there are any two nodes with the same title and level combo
    let namedNodes = [];
    tree.forEach(node => {
        namedNodes.push(`${node.type}-${node.title}-${node.level}`);
    });

    let duplicates = namedNodes.filter((item, index) => {
        return namedNodes.indexOf(item) != index
    });

    return [...new Set(duplicates)];
}
