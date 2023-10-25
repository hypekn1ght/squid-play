import { Squid, TokenData, ChainData, ChainName } from "@0xsquid/sdk";
import { ethers } from "ethers";
import * as dotenv from "dotenv";
import { Token, ChainType, Volatility } from "@0xsquid/squid-types";

// global.ChainType = { COSMOS: 0 };
// global.Volatility = { SUPER_STABLE: 0, STABLE: 1, HIGH_CAP: 2, VOLATILE: 3 };

import fs from "fs";
import os from "os";
import * as parser from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
let chain = process.argv[2];

if (!chain) {
    console.log("no chain is specified");
    process.exit(1);
}

let homeDir = os.homedir();

let v1FileLoc = `${homeDir}/Documents/squid/squid-core/packages/api/src/v1/constants/tokens/mainnet/${chain}.json`;
var v1File, v1Tokens;
let v1Count: number = 0;
let v1Set: Set<string> = new Set;
try {
    v1File = fs.readFileSync(v1FileLoc);
    v1Tokens = JSON.parse(v1File.toString());
    // loop through v1Tokens and have a set of IDs
    for (let token of v1Tokens!) {
        v1Set.add(token.address);
        v1Count++;
    }
} catch (err) {
    console.log(`❌ ${chain} v1 json doesn't exist ❌`);
}

let v2FileLoc = `${homeDir}/Downloads/AxelarTokens/mainnet/${chain}.ts`;
let v2File = fs.readFileSync(v2FileLoc, 'utf-8');
const ast = parser.parse(v2File, {
    sourceType: 'module',
    plugins: ['typescript'],
});

let v2tokens: Token[] | null = null;

traverse(ast, {
    VariableDeclarator(path: any) {
        if (
            t.isIdentifier(path.node.id, { name: `${chain}Tokens` }) &&
            t.isArrayExpression(path.node.init)
        ) {
            v2tokens = path.node.init.elements.map((element: any) => {
                if (t.isObjectExpression(element)) {
                    const obj: { [key: string]: any } = {};
                    element.properties.forEach(prop => {
                        if (t.isObjectProperty(prop) && t.isIdentifier(prop.key)) {
                            var key = prop.key.name;
                            if (key == "subGraphId") key = "commonKey";
                            if (key == "subGraphOnly") key = "bridgeOnly";
                            const valueNode = prop.value;
                            if (
                                t.isStringLiteral(valueNode) ||
                                t.isNumericLiteral(valueNode) ||
                                t.isBooleanLiteral(valueNode)
                            ) {
                                obj[key] = valueNode.value;

                                // cosmos v2 => v1 convention
                                // if key is ibcDenom => replace address with ibcDenom
                                // add path key which doesn't exist in v2
                                if (key == "ibcDenom") {
                                    obj["address"] = valueNode.value;
                                    obj["pathKey"] = obj["symbol"].toLowerCase() + `_${chain}`;
                                }
                            }
                        }
                    });
                    return obj;
                }
                return {};
            });
            path.stop(); 
        }
    },
});

let tokensToAdd: Token[] | null = [];
let v2Count: number = 0;
let toAddCount: number = 0;

for (let token of v2tokens!) {
    v2Count++;
    if (!v1Set.has(token.address!)) {
        tokensToAdd.push(token);
        toAddCount++ 
    }
}

if (tokensToAdd.length > 0) {
    const jsonToLog = JSON.stringify(tokensToAdd);
    console.log("➕➕➕➕➕➕➕➕➕➕➕➕")
    console.dir(jsonToLog, {depth: null});
    fs.writeFileSync('./buffer.json', jsonToLog, 'utf-8');
    console.log(`v1 count: ${v1Count}, v2 count: ${v2Count}, to add: ${toAddCount}`);
    process.exit(0);
} else {
    console.error(`No tokens to add on ${chain} ✅`);
    process.exit(0);
}
