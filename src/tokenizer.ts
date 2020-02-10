
import * as chevrotain from 'chevrotain/lib/chevrotain'

const createToken = chevrotain.createToken

const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: chevrotain.Lexer.SKIPPED
})

const Comment = createToken({
    name: 'Comment',
    pattern : /#.*/,
    group: 'Comment'
})

const StringLiteral = createToken({
    name: "StringLiteral",
    pattern: /"([^"\\]|\\.)*"/
})

const StringLiteral2 = createToken({
    name: "StringLiteral2",
    pattern: /'([^'\\]|\\.)*'/
})

const Text = createToken({
    name: 'Text',
    pattern: /([^\s|;|\#|{]|\|)+/
})

const LCurly = createToken({name: "LCurly", pattern: /{/})
const RCurly = createToken({name: "RCurly", pattern: /}/})

const Semicolon = createToken({name: "Semicolon", pattern: /;/})

export const AllTokens = {
    WhiteSpace,
    Comment,
    StringLiteral,
    StringLiteral2,
    LCurly,
    RCurly,
    Semicolon,
    Text,
}

export const Lexer = new chevrotain.Lexer(Object.values(AllTokens))