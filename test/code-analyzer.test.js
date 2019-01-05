import assert from 'assert';
import {parseCode} from '../src/js/code-analyzer';

describe('The javascript parser', () => {
    it('TEST 1', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    while (a < z) {\n' +
                '        c = a + b;\n' +
                '        z = c * 2;\n' +
                '    }\n' +
                '    \n' +
                '    return z;\n' +
                '}\n')),
            '"function foo(x, y, z) {\\n    while (x + 1 < z) {\\n        z = (x + 1 + (x + 1 + y)) * 2;\\n    }\\n    return z;\\n}"'
        );
    });

    it('TEST 2', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n')),
            '"function foo(x, y, z) {\\n    if (x + 1 + y < z) {\\n        return x + y + z + (0 + 5);\\n    } else if (x + 1 + y < z * 2) {\\n        return x + y + z + (0 + x + 5);\\n    } else {\\n        return x + y + z + (0 + z + 5);\\n    }\\n}"'
        );
    });

    it('TEST 3', () => {
        assert.equal(
            JSON.stringify(parseCode('let a = 3;\n' +
                'function foo(x, y, z){\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n')),
            '"let a = 3;\\nfunction foo(x, y, z) {\\n    if (a + y < z) {\\n        return x + y + z + (0 + 5);\\n    } else if (a + y < z * 2) {\\n        return x + y + z + (0 + x + 5);\\n    } else {\\n        return x + y + z + (0 + z + 5);\\n    }\\n}"'
        );
    });

    it('TEST 4', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(){\n' +
                'return 1;\n' +
                '}\n')),
            '"function foo() {\\n    return 1;\\n}"'
        );
    });
    it('TEST 5', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '        c = c + 5;\n' +
                '        let a = x +1;\n' +
                '        return x + y + z + c;\n' +
                '    } else if (b < z * 2) {\n' +
                '        c = c + x + 5;\n' +
                '        return x + y + z + c;\n' +
                '    } else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n')),
            '"function foo(x, y, z) {\\n    if (x + 1 + y < z) {\\n        return x + y + z + (0 + 5);\\n    } else if (x + 1 + y < z * 2) {\\n        return x + y + z + (0 + x + 5);\\n    } else {\\n        return x + y + z + (0 + z + 5);\\n    }\\n}"'
        );
    });

    it('TEST 6', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '    let a = x + 1;\n' +
                '    let b = a + y;\n' +
                '    let c = 0;\n' +
                '    \n' +
                '    if (b < z) {\n' +
                'while(a > 4){\n' +
                'a = a + 1;\n' +
                '}\n' +
                '    }else {\n' +
                '        c = c + z + 5;\n' +
                '        return x + y + z + c;\n' +
                '    }\n' +
                '}\n')),
            '"function foo(x, y, z) {\\n    if (x + 1 + y < z) {\\n        while (x + 1 > 4) {\\n        }\\n    } else {\\n        return x + y + z + (0 + z + 5);\\n    }\\n}"'
        );
    });

    it('TEST 7', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '    \n' +
                '    if (b < z) {\n' +
                '       return 5;\n' +
                '    }\n' +
                '}\n')),
            '"function foo(x, y, z) {\\n    if (b < z) {\\n        return 5;\\n    }\\n}"'
        );
    });

    it('TEST 8', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '    if (x + 1 + y < z) {\n' +
                '        return x + y + z + 5;\n' +
                '    } else if (x + 1 + y < z * 2) {\n' +
                '        return x + y + z + x + 5;\n' +
                '    } else {\n' +
                '        return x + y + z + z + 5;\n' +
                '    }\n' +
                '}\n')),
            '"function foo(x, y, z) {\\n    if (x + 1 + y < z) {\\n        return x + y + z + 5;\\n    } else if (x + 1 + y < z * 2) {\\n        return x + y + z + x + 5;\\n    } else {\\n        return x + y + z + z + 5;\\n    }\\n}"'
        );
    });

    it('TEST 9', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '    if (x + 1 + y < z) {\n' +
                '        return x + y + z + 5;\n' +
                '    } else {\n' +
                '        return x + y + z + z + 5;\n' +
                '    }\n' +
                '}\n')),
            '"function foo(x, y, z) {\\n    if (x + 1 + y < z) {\\n        return x + y + z + 5;\\n    } else {\\n        return x + y + z + z + 5;\\n    }\\n}"'
        );
    });

    it('TEST 9', () => {
        assert.equal(
            JSON.stringify(parseCode('function foo(x, y, z){\n' +
                '    if (x + 1 + y < z) {\n' +
                '        return x + y + z + 5;\n' +
                '    } else {\n' +
                '        return x + y + z + z + 5;\n' +
                '    }\n' +
                '}\n')),
            '"function foo(x, y, z) {\\n    if (x + 1 + y < z) {\\n        return x + y + z + 5;\\n    } else {\\n        return x + y + z + z + 5;\\n    }\\n}"'
        );
    });

    it('TEST 10', () => {
        assert.equal(
            JSON.stringify(parseCode('let b = 10\n' +
                'function foo(x, y, z){\n' +
                'let c= y + z;\n' +
                '    return b + c;\n' +
                '}\n')),
            '"let b = 10;\\nfunction foo(x, y, z) {\\n    return b + y + z;\\n}"'
        );
    });
    it('TEST 11', () => {
        assert.equal(
            JSON.stringify(parseCode('let b = 10\n' +
                'function foo(x, y, z){\n' +
                'let c= y + z;\n' +
                'c++;\n'+
                '    return b + c;\n' +
                '}\n')),
            '"let b = 10;\\nfunction foo(x, y, z) {\\n    return b + y + z;\\n}"'
        );
    });
});
