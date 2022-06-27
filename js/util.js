function generateUID() {
    return "IR-" + ([1e7] + -1e3 + -4e3).replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

// I don't even know what I just wrote
function isEqualJson(obj1, obj2) {
    let keys1 = Object.keys(obj1);
    let keys2 = Object.keys(obj2);

    //return true when the two json has same length and all the properties has same value key by key
    let r = keys1.length === keys2.length && Object.keys(obj1).every(key => {
        return typeof obj1[key] == "object" ? JSON.stringify(obj1[key]) == JSON.stringify(obj2[key]) : obj1[key] == obj2[key]; 
    });
    return r;
}

// replace all instance of an ID with a new ID including the children and required fields
function replaceID(tree, id, newId) {
    let stringTree = JSON.stringify(tree);
    stringTree = stringTree.replace(new RegExp(id, 'g'), newId);
    return JSON.parse(stringTree);
}