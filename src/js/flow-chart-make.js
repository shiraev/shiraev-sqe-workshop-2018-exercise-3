import * as escodegen from 'escodegen';
import * as esprima from 'esprima';

const start = 'st=>start:  |approved\n';
const end = 'e=>end:  |approved\n';
let global_counter = 0;
let cond_counter = 0;
let oper_counter = 0;
let originCode = '';
let lines = [];
let colors_map = [];
let curr_color = 'approved';
let cons;

let if_creator = function  (value)
{
    global_counter++;
    cond_counter++;
    let name = 'cond'+ cond_counter;
    connect_last_block(name);
    createBlockConnection(name+'(yes)');
    let prefix = '-' + global_counter + '-\n';
    let color = curr_color;
    let final_string = name +'=>condition: '+ prefix + value +'|'+color+'\n';
    let type = 'cond';
    let res = {global_counter, type, name, color, final_string};
    lines.push(res);
    return name;
};

let operation_creator = function  (value)
{
    global_counter++;
    oper_counter++;
    let name = 'op' + oper_counter;
    connect_last_block(name);
    let prefix = '-' + global_counter + '-\n';
    let color = curr_color;
    let final_string = name +'=>operation: '+ prefix +value +'|'+color+'\n';
    let type = 'other';
    let res = {global_counter, type, name, color, final_string};
    lines.push(res);
    return res;
};


let value_clean = function(value)
{
    let index = value.indexOf('let ');
    if(index !== -1){
        return value.substring(index + 4, value.length - 1);
    }
    return value.substring(0, value.length - 1);
};

let op_handler = function (node) {
    let value = escodegen.generate(node);
    return operation_creator(value_clean(value));
};

let shift_color = function (color)
{
    if(color === 'past')
        curr_color = 'approved';
    else
        curr_color = 'past';
};
let while_handler = function (node) {
    let type =  'start of body', num = 0, name = 'NULL';
    connect_last_block(name);
    let final_string = 'NULL=>operation: NULL|approved\n';
    let body_flag_s = {num, type, name, final_string};
    lines.push(body_flag_s);
    let range = node.test['range'];
    let test = originCode.substring(range[0],range[1]);
    let wl = if_creator(test);

    let body = node_creator(node.body.body);
    type =  'end of body';
    let body_flag_e = {num, type};
    body.concat([body_flag_e]);
    lines.push(body_flag_e);
    connect_last_block(name);
    connect_last_block(wl);
    createBlockConnection(wl+'(no)');
    return [wl].concat(body);
};
let if_handler = function (node) {
    let range = node.test['range'];
    let test = originCode.substring(range[0],range[1]);
    let fs = if_creator(test);
    let c = colors_map[0].color;
    colors_map.shift();
    curr_color = c;
    let body = node_creator(node.consequent.body);
    let type =  'end of body', num = 0;
    let body_flag = {num, type};
    body.concat([body_flag]);
    lines.push(body_flag);
    shift_color(c);
    let alter = [];
    if(node.alternate !== null) {
        createBlockConnection(fs+'(no)');
        alter = handle_node(node.alternate);
    }
    return [fs].concat(body).concat(alter);
};

let block_handler = function (node)
{
    let type =  'end of body';
    let num = 0;
    let body_flag = {num, type};
    let block = node_creator(node.body);
    lines.push(body_flag);
    curr_color = 'approved';
    return [block].concat([body_flag]);
};

let handle_node = function(node) {
    return handlers[node.type](node);
};

let node_creator = function (body)
{
    let ret = [];
    for(let i = 0; i < body.length; i++){
        ret.push(handle_node(body[i]));
    }
    return ret;
};

let extractBody = function (x){
    if ('body' in x.body)
        return x.body.body;
    else return x.body;
};


function createBlockConnection(toInsert) {
    cons.push([toInsert,'']);
}


function is_last_row_contain(str) {
    let lastElement = cons[cons.length-1][0];
    return lastElement.startsWith(str);
}

function connect_last_block(s) {
    if(is_last_row_contain('cond') && cons[cons.length-1][1] ==='') {
        cons[cons.length - 1][1] = '->' + s;
    }else{
        cons[cons.length-1][1] =  cons[cons.length-1][1] + '->' + s;
    }
}

let lines_to_string = function()
{
    let string = '';
    for (let i = 0; i< lines.length; i++){
        if('final_string' in lines[i])
            string = string + lines[i].final_string;
    }
    return string;
};

let connect_to_e = function()
{
    cons.map(curr => {
        let s = curr[1];
        let sub1 = s.substring(1, s.length-1);
        let sub2 = s.substring(1, s.length-2);
        if(sub1.endsWith('op') || sub2.endsWith('op')) {
            curr[1] = curr[1] + '->e';
        }
    });
};

let sep_last = function()
{
    let last = cons[cons.length-1][1];
    let e_index = last.lastIndexOf('->');
    let clean = last.substring(0, e_index);
    let ret_index = clean.lastIndexOf('->');
    let ret = clean.substring(ret_index+2, clean.length);
    let clean_ret = last.substring(0, ret_index);
    cons[cons.length-1][1] = clean_ret + '->e';
    cons.push(['e','->'+ret]);
};

let cons_to_string = function()
{
    connect_to_e();
    sep_last();
    let string = '';
    cons.map(x =>{
        if(x[1] !==''){
            string = string + ''+x[0] + x[1]+'\n';
        }});
    return string;
};


let creator = function (code, colors)
{
    cons = [];
    cons.push(['st', '']);
    global_counter = 0;
    cond_counter = 0;
    oper_counter = 0;
    colors_map = colors;
    lines = [];
    originCode = code;
    let obj = esprima.parseScript(code, {loc:true, range: true});
    node_creator(extractBody(extractBody(obj)[0]));
    let map = cons_to_string();
    let final_lines = lines_to_string();
    return start + end + final_lines + '\n' + map;
};




let handlers = {
    VariableDeclaration : op_handler,
    AssignmentExpression : op_handler,
    ExpressionStatement : op_handler,
    WhileStatement : while_handler,
    IfStatement : if_handler,
    ReturnStatement : op_handler,
    BlockStatement : block_handler
};

export {creator};