
import * as chevrotain from 'chevrotain/lib/chevrotain'

const createToken = chevrotain.createToken

const WhiteSpace = createToken({
    name: "WhiteSpace",
    pattern: /\s+/,
    group: chevrotain.Lexer.SKIPPED
})

const Comment = createToken({
    name: 'Comment',
    pattern: /#.*/,
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
    line_breaks: false,
    pattern: (text, startOffset) => {

        const skipInterpolation = start => {
            for (let i = start; i < text.length; i++) {
                if (text[i] === '}') {
                    return i
                }
            }
            return i
        }

        const exit = end => {
            if (startOffset === end) {
                return null
            } else {
                return [text.substring(startOffset, end)] as [string]
            }

        }

        let i = startOffset
        for (; i < text.length; i++) {
            switch (text[i]) {
                case ' ':
                case ';':
                case '#':
                case '{':
                case '}':
                case '\n':
                    return exit(i)
                case '$':
                    if (text[i + 1] === '{') {
                        i = skipInterpolation(i + 1)
                    }
            }
        }

        if (startOffset === i) {
            return null
        } else {
            return [text.substring(startOffset, i)]
        }
    },

})

const LCurly = createToken({ name: "LCurly", pattern: /{/ })
const RCurly = createToken({ name: "RCurly", pattern: /}/ })

const Semicolon = createToken({ name: "Semicolon", pattern: /;/ })

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
