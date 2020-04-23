import { Visitor } from "./visitor"
import { FormatterEmitter } from "./emitter"
import { Lexer } from "./tokenizer"
import { Parser } from "./parser"

const visitor = new Visitor()

export interface IFormatingOptions {
    indent?: string,
    newLineSeparator?: string
    maxStatementLength?: number
}

const defaultOptions: Required<IFormatingOptions> = {
    indent: '\t',
    newLineSeparator: '\n',
    maxStatementLength: 80
}

export function nginxFormat(
    configString: string,
    options: IFormatingOptions = {}
): string {

    const mergedOptions = { ...defaultOptions, ...options }

    const lexingResult = Lexer.tokenize(configString)
    if(lexingResult.errors.length) {
        throw new Error('Syntax Error: ' + JSON.stringify(lexingResult.errors))
    }
    Parser.input = lexingResult.tokens

    const ctx = (Parser as any).Block()
        if(Parser.errors.length) {
            throw new Error('Parsing Error:' + JSON.stringify(Parser.errors))
        }
    const ast = visitor.visit(ctx)

    return new FormatterEmitter(mergedOptions).generateOutput(ast, lexingResult.groups.Comment)

}
