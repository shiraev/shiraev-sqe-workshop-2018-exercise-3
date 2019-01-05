import * as esprima from 'esprima';
import * as escodegen from 'escodegen';

let originCode;
let globals =[];
let params = [];
let funcBody;
let varDecTable = [];
let scopedVarDecTable = [];
/*
const supported = [
    'VariableDeclaration' ,
    'ExpressionStatement',
    'AssignmentExpression',
    'ReturnStatement'];*/

/**************GENERAL********************/
let erase = function (x) {
    for (let i = 0; i < funcBody.length; i++){
        if(funcBody[i] === x){
            let tmp = funcBody;
            funcBody = funcBody.slice(0,i).concat(tmp.slice(i+1,tmp.length));
            break;
        }
    }
};

let change = function (x) {
    for (let i = 0; i < funcBody.length; i++){
        if(funcBody[i] === x){
            let tmp = funcBody;
            funcBody = funcBody.slice(0,i).concat(x).concat(tmp.slice(i+1,tmp.length));
            break;
        }
    }
};
/*
function flatten(arr) {
    return arr.reduce(function (flat, toFlatten) {
        return flat.concat(Array.isArray(toFlatten) ? flatten(toFlatten) : toFlatten);
    }, []);
}*/
/*
let isSupported = function (x) {
    for (let i = 0; i < supported.length; i++){
        if (x === supported[i])
            return true;
    }
    //return false;
};
*/
let inVarDecTable = function (x){
    for (let i = 0; i < varDecTable.length; i++) {
        if (varDecTable[i][0].name === x) {
            return true;
        }
    }
    return false;
};

let inScopedVarDecTable = function (x, depth){
    for (let i = 0; i < scopedVarDecTable[depth].length; i++) {
        if (scopedVarDecTable[depth][i][0].name === x) {
            return true;
        }
    }
    return false;
};

let inParams = function (x){
    for (let i = 0; i < params.length; i++) {
        if (params[i] === x) {
            return true;
        }
    }
    return false;
};

let getRealVal = function(x){
    for (let i = 0; i < varDecTable.length; i++){
        if(varDecTable[i][0].name === x){
            return varDecTable[i][0].value;
        }
    }
    //return [];
};

let getScopedRealVal = function(x, depth){
    for (let i = 0; i < scopedVarDecTable[depth].length; i++){
        if(scopedVarDecTable[depth][i][0].name === x){
            return scopedVarDecTable[depth][i][0].value;
        }
    }
    //return [];
};
let valueRewrite = function(value, scope, depth){
    if(scope)
        return valueRewriteScope(value, depth);
    else
        return valueRewriteUnScope(value);
};

let specialParam = function(value){
    let index = value.search(' ');
    if(index === 0) index = 1;
    if(index === -1) index = value.length;
    let val = value.substring(0, index);
    return {val, index};
};
let valueRewriteUnScope = function(value){
    let valOr = value, flag = 1, index;
    value = '(' + value + ' ';
    for (let i = 0; i < valOr.length && 1; i = i + index){
        let val = specialParam(valOr.substring(i, valOr.length));
        let  param = val.val;
        index = val.index;
        if (inVarDecTable(param)){
            flag = 2;
            let index = value.search(param + ' '), paramVal = getRealVal(param) + ' ';
            let tmp = value;
            value = value.substring(0, index).concat(paramVal)
                .concat(tmp.substring(index + 1 + param.length, tmp.length));
            i = i + param.length;
        }
    }
    if(flag === 1)
        return valOr;
    return value + ')';
};


let valueRewriteScope = function(value, depth){
    let valOr = value, flag = 1, index;
    value = '(' + value + ' ';
    for (let i = 0; i < valOr.length && 1; i = i + index){
        let val = specialParam(valOr.substring(i, valOr.length)), param = val.val;
        index = val.index;
        if (inScopedVarDecTable(param, depth)){
            flag = 2;
            let index = value.search(param + ' ');
            let paramVal = getScopedRealVal(param, depth) + ' ';
            let tmp = value;
            value = value.substring(0, index).concat(paramVal)
                .concat(tmp.substring(index + 1 + param.length, tmp.length));
            i = i + param.length;
        }
    }
    if(flag === 1)
        return valOr;
    return value + ')';
};

let changeAssValue = function(x, value){
    x.expression.right = value;
    return x;
};

/*
let changeAssValue = function(x, value){
    if(x.expression.type === 'AssignmentExpression') {
        x.expression.right = value;
        return x;
    }
    //return [];
};*/

let changeRetValue = function(x, value){
    if('name' in x.argument)
        x.argument.name = value;
    else {
        x.argument = esprima.parse(value).body[0].expression;
    }
    return x;
};

let changeWhileValue = function(x, test, body){
    x.test = test;
    x.body.body = body;
    return x;
};

let changeIfValue = function(x, test, body, alter){
    x.alternate = alter;
    x.test = test;
    x.consequent.body = body;
    return x;
};

let changeElseValue = function(x, body){
    x.body = body;
    return x;
};

/************ HANDLERS *************/

/************VARS****************//*
let varHandlerValueHelper = function (x) {//helper
    if(x.init !== null){
        let range = x.init['range'];
        return originCode.substring(range[0],range[1]);
    }
    //return [];
};
*/
let varHandlerValueHelper = function (x) {//helper
    let range = x.init['range'];
    return originCode.substring(range[0],range[1]);
};
let varOrganizer = function (name, value){//helper
    let id = 'let';
    return {id, name, value};
};

let varDecAdd = function (x, scope, depth){
    let name = (x.declarations).map( x => x.id['name']);
    let value = (x.declarations).map( x => varHandlerValueHelper(x));
    let vars =[];
    if(scope)
        value = value.map(x => valueRewrite(x, true, depth));
    else
        value = value.map(x => valueRewrite(x, false, depth));
    for (let i= 0; i < name.length; i++)
        vars[i] = varOrganizer(name[i], value[i]);
    if(scope)
        scopedVarDecTable[depth].push(vars);
    else
        varDecTable.push(vars);
    erase(x);
    return undefined;
};

/************ASS****************/
let searchByNameAndSwap = function (name, value){
    for (let i = 0; i < varDecTable.length; i++){
        if(varDecTable[i][0].name === name){
            varDecTable[i][0].value = value;
        }
    }
};

let searchByNameAndSwapScoped = function (name, value, depth){
    for (let i = 0; i < scopedVarDecTable[depth].length; i++){
        if(scopedVarDecTable[depth][i][0].name === name){
            scopedVarDecTable[depth][i][0].value = value;
        }
    }
};

let assignmentHandler = function (assC, exp, scope, depth) {
    let name = assC.left['name'];
    let range = assC.right['range'];
    let value = originCode.substring(range[0],range[1]);
    if(scope)
        value = valueRewrite(value, true, depth);
    else
        value = valueRewrite(value, false, depth);
    if(scope)
        searchByNameAndSwapScoped(name, value, depth);
    else searchByNameAndSwap(name, value);
    value = esprima.parse(value).body[0].expression;
    if(inParams(name)){
        exp = changeAssValue(exp, value);
        change(exp);
        return exp;
    }
    else erase(exp);
    return undefined;
};


/*******EXP*******/
const expHandler = function (expC, scope, depth) {//helper
    //if ('expression' in expC && isSupported(expC.expression.type))
    return handlers[expC.expression.type](expC.expression, expC, scope, depth);
    //return [];
};

/*************WHILE*****************/

const whileHandler = function (whileC, scope, depth) {

    let range = whileC.test['range'];
    let value = originCode.substring(range[0],range[1]);
    if(scope)
        value = valueRewrite(value, true, depth);
    else
        value = valueRewrite(value, false, depth);
    let test = esprima.parse(value).body[0].expression;
    let body = parseBody(whileC.body.body, false, depth).filter(x => x !== undefined);
    whileC = changeWhileValue(whileC, test, body);

    change(whileC);
    return whileC;
};
/*************if if else else****************/



const elseHandler = function (else_, scope, depth) {
    scopedVarDecTable[depth] = JSON.parse(JSON.stringify(varDecTable));
    let body = parseBody(else_.body, scope, depth).filter(x => x !== undefined);
    else_ = changeElseValue(else_, body);
    return else_;
};

let whichAlter = function(ifC, scope, depth){
    let alter = null;
    if('alternate' in ifC && ifC.alternate !== undefined && ifC.alternate !== null){
        if(ifC.alternate.type === 'IfStatement'){
            alter = ifHandler(ifC.alternate, scope, depth + 1);
        } else {
            alter = elseHandler(ifC.alternate, scope, depth + 1);
        }
    }
    return alter;
};

function ifHandler (ifC, scope, depth) {
    scope = true;
    //if(varDecTable !== [])
    scopedVarDecTable[depth] = JSON.parse(JSON.stringify(varDecTable));
    let alter = whichAlter(ifC, scope, depth);
    let body = parseBody(ifC.consequent.body, scope, depth).filter(x => x !== undefined);
    let range = ifC.test['range'];
    let testValue = originCode.substring(range[0],range[1]);

    testValue = valueRewrite(testValue, true, depth);
    /*else
        testValue = valueRewrite(testValue, false, depth);*/
    let test = esprima.parse(testValue).body[0].expression;
    ifC = changeIfValue(ifC, test, body, alter);

    change(ifC);
    /*if(depth === 0)
        scopedVarDecTable = [];*/
    return ifC;
}

/*********update*******/
const updateHandler = function () {

};

/**********RETURN*************/

const returnHandler = function (retC, scope, depth)  {
    let range = retC.argument['range'];
    let value = originCode.substring(range[0],range[1]);
    if(scope)
        value = valueRewrite(value, true, depth);
    else
        value = valueRewrite(value, false, depth);
    retC = changeRetValue(retC, value);
    change(retC);
    return retC;
};

/**********************************/
let handlers = {
    VariableDeclaration : varDecAdd ,
    AssignmentExpression : assignmentHandler,
    ExpressionStatement : expHandler,
    WhileStatement : whileHandler,
    IfStatement : ifHandler,
    ReturnStatement : returnHandler,
    UpdateExpression: updateHandler
};
/*
let getHandler = function(curr, scope, depth) {
    if(curr.type in handlers) {
        return handlers[curr.type](curr, scope, depth);
    }
    //else return [];
};
*/
let getHandler = function(curr, scope, depth) {
    return handlers[curr.type](curr, scope, depth);
};

/*************PARSING****************/
let extractParams = function (x){
    return (x.params).map( x => x['name']);
};
/*
let extractParams = function (x){
    if('params' in x)
        return (x.params).map( x => x['name']);
    //return [];
};*/
let extractBody = function (x){
    if ('body' in x.body)
        return x.body.body;
    else return x.body;
};
/*
let extractBody = function (x){
    if('body' in x)
        if ('body' in x.body)
            return x.body.body;
        else return x.body;
    //return [];
};*/

let parseBody = function (x, scope, depth) {
    return x.map(x => getHandler(x, scope, depth));
};
/*
let parse = function (x) {
    let body = extractBody(x);
    let func = body[0];
    params = extractParams(func);
    funcBody = extractBody(func);
    let a =  funcBody.map(x => getHandler(x));
    return [a].concat(params).concat(funcBody);
};*/

let handleGlobals = function (body) {
    for(let i = 0; i < body.length; i++){
        if(body[i].type === 'VariableDeclaration'){
            let x = body[i];
            let name = (x.declarations).map( x => x.id['name']);
            let value = (x.declarations).map( x => varHandlerValueHelper(x));
            let vars =[];
            for (let i= 0; i < name.length; i++)
                vars[i] = varOrganizer(name[i], value[i]);
            globals.push(vars);
            let tmp = vars.map(x => x['name']);
            params.push(tmp[0]);
        }
        else
            return body[i];
    }
};

let funcIndex = function (body) {
    for(let i = 0; i < body.length; i++){
        if(body[i].type === 'FunctionDeclaration') {
            return i;
        }
    }
};

let parse = function (x) {
    let body = extractBody(x);
    let func = handleGlobals(body);
    params = params.concat(extractParams(func));
    funcBody = extractBody(func);
    let a =  funcBody.map(x => getHandler(x, false, 0));
    func.body.body = a.filter(x => x !== undefined);
    body[funcIndex(body)] = func;
    x.body = body;
    return x;
};


const parseCode = (codeToParse) => {
    varDecTable = [];
    scopedVarDecTable = [];
    globals = [];
    params = [];
    originCode = codeToParse;
    let tmp1 = esprima.parseScript(codeToParse, {loc:true, range: true});
    let tmp2 = parse(tmp1);
    return escodegen.generate(tmp2);
};
/*

const parseCode = (codeToParse) => {
    originCode = codeToParse;

    return flatten(parse(esprima.parseScript(codeToParse, {loc:true, range: true})));
};*/

export {parseCode};
