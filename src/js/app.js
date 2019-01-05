import $ from 'jquery';
import {parseCode} from './code-analyzer';
import {creator} from './flow-chart-make';
import * as esprima from 'esprima';
import * as flowchart from 'flowchart.js';
var safeEval = require('safe-eval');


let userInput;
let globals = [];
let params = [];
let originCode;
let sub;
let colors = [];
let cond_counter = 0;

let extractParams = function (x){
    if('params' in x)
        return (x.params).map( x => x['name']);
    return [];
};


let extractArgsVal = function(x) {
    let values = x.substring(1, x.length - 1).split(' ');
    return values.filter(x => x !== ',');
};
let varHandlerValueHelper = function (x) {
    if(x.init !== null){
        let range = x.init['range'];
        return originCode.substring(range[0],range[1]);
    }
    return [];
};

let varOrganizer = function (name, value){
    return {name, value};
};

let handleGlobal = function (x) {
    let program = esprima.parseScript(x, {loc:true, range: true});
    let body = program.body;
    for(let i = 0; i < body.length; i++){
        if(body[i].type === 'VariableDeclaration'){
            let x = body[i];
            let name = (x.declarations).map( x => x.id['name']);
            let value = (x.declarations).map( x => varHandlerValueHelper(x));
            let vars =[];
            for (let i= 0; i < name.length; i++)
                vars[i] = varOrganizer(name[i], value[i]);
            globals.push(vars[0]);
        }
        else {
            params = params.concat(extractParams(body[i]));
            break;
        }
    }
};

let handleArray = function(varT){
    let vars = [];
    let values;
    if(varT.value.indexOf('[') !== -1){
        let vals = (varT.value).substring(1, varT.value.length -1 );
        values = (vals).split(',');
        for (let i = 0; i < values.length; i++) {
            vars[i] = varOrganizer(varT.name + '[' + i + ']', values[i]);
        }
    }
    return vars;
};

let mergeValues = function (){
    let argsVal = [];
    for (let i= 0, j = 0; j < params.length; i++, j ++) {
        argsVal[i] = varOrganizer(params[j], userInput[j]);
        let tmp = handleArray(argsVal[i]);
        if(tmp.length !== 0){
            argsVal = argsVal.concat(tmp);
            i = i + tmp.length;
        }
    }
    globals = globals.concat(argsVal);
};
let getRealVal = function (x) {
    for (let i = 0; i < globals.length; i++){
        if(globals[i].name === x){
            return globals[i].value;
        }
    }
    return x;
};
let replaceTest = function(test) {
    let newTest = '';
    for (let i = 0; i < test.length; i++){
        newTest = newTest + getRealVal(test[i]);
    }
    return newTest;
};

let createColor = function (bool){
    let color;
    if(bool)
        color = 'approved';
    else color = 'past';
    cond_counter++;
    colors.push({cond_counter, color});
};

let ifLine = function (line, i){
    if(sub[i] === '\n') {
        line = line + 1;
    }
    return line;
};



let ifSearchAndEval = function () {
    let tmp, line = 1;
    for (let i = 0; i < sub.length; i++){
        if(sub[i] === 'i' && sub[i+1] === 'f'){
            let j = i + 2;
            tmp = sub[j];
            j++;
            while (sub[j]!== '{') {
                tmp = tmp + sub[j -1];
                j++;
            }
            tmp = tmp.substring(3, tmp.length-1);
            let repTest = replaceTest(tmp);
            let test = safeEval(repTest);
            createColor(test);
        } else {
            line = ifLine(line, i);
        }
    }
};

let start = function () {
    mergeValues();
    ifSearchAndEval();
    let string_chart = creator(originCode, colors);
    let diagram = flowchart.parse(string_chart);
    diagram.drawSVG(document.getElementById('diagram'),{
        'x': 0, 'y': 0, 'line-width': 3, 'line-length': 50, 'text-margin': 10, 'font-size': 14, 'font-color': 'black', 'line-color': 'black', 'element-color': 'black', 'fill': 'white', 'yes-text': 'yes', 'no-text': 'no', 'arrow-end': 'block', 'scale': 1,
        'symbols': {
            'start': {'font-color': 'red', 'element-color': 'green', 'fill': 'yellow'},
            'end':{'class': 'end-element'}},
        'flowstate' : {
            'past' : { 'fill' : '#CCCCCC', 'font-size' : 12},
            'current' : {'fill' : 'yellow', 'font-color' : 'red', 'font-weight' : 'bold'},
            'future' : { 'fill' : '#FFFF99'},
            'request' : { 'fill' : 'blue'}, 'invalid': {'fill' : '#444444'},
            'approved' : { 'fill' : '#58C4A3', 'font-size' : 12, 'yes-text' : 'T', 'no-text' : 'F' },
            'rejected' : { 'fill' : '#C45879', 'font-size' : 12, 'yes-text' : 'n/a', 'no-text' : 'REJECTED' }
        }
    });
};

//Document.getElementById('');

$(document).ready(function () {
    $('#codeSubmissionButton').click(() => {
        globals = [];
        params = [];
        colors = [];
        cond_counter = 0;
        let codeToParse = $('#codePlaceholder').val();
        originCode = codeToParse;
        handleGlobal(codeToParse);
        sub =  parseCode(codeToParse);
    });
    $('#inputSubmissionButton').click(() => {
        let input = $('#inputPlaceholder').val();
        input = JSON.stringify(input, null, 2);
        userInput = extractArgsVal(input);
        start();
    });
});

//























/*
function getBr(){
    return document.createElement('br');
}

function getSpan(){
    return document.createElement('span');
}

let addLine = function(lineText, line, paragraph, div1){
    lineText = document.createTextNode(line);
    let span= getSpan();
    span.appendChild(lineText);
    paragraph.appendChild(span);
    paragraph.appendChild(getBr());
    div1.appendChild(paragraph);
};

let ifTmp = function (lineNum, span) {
    if(colors!==null && colors.length>0) {
        if (colors[0].line === lineNum) {
            span.className = colors[0].color;
            colors.shift();
        }
    }
};

function DisplayFunc(){
    let div1 = document.getElementById('div1'), paragraph = document.createElement('p'), line='', lineText, lineNum=0;
    div1.innerHTML = '';
    for (let i = 0; i < sub.length; i++)
    {
        let c = sub.charAt(i);
        if(c ==='\n'){
            lineNum++;
            lineText = document.createTextNode(line);
            let span= getSpan();
            ifTmp(lineNum, span);
            span.appendChild(lineText);
            paragraph.appendChild(span);
            paragraph.appendChild(getBr());
            line='';
        } else if(c === '{') line = line +'\t' + c; else line = line + c;
    }
    addLine(lineText, line, paragraph, div1);
}

*/