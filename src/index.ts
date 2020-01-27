import { Visitor } from "./visitor"
import { FormatedEmitter } from "./emitter"
import { Lexer } from "./tokenizer"
import { Parser } from "./parser"

const visitor = new Visitor()

export interface IFormatingOptions {
    indent?: string,
    maxStatementLength?: number
}

const defaultOptions: Required<IFormatingOptions> = {
    indent: '\t',
    maxStatementLength: 80
}

export function formatNginxConfig(
    configString: string,
    options: IFormatingOptions
): string {

    const mergedOptions = { ...defaultOptions, ...options }

    const lexingResult = Lexer.tokenize(configString)
    Parser.input = lexingResult.tokens
    const ctx = (Parser as any).Block()
    const ast = visitor.visit(ctx)


    return new FormatedEmitter(mergedOptions).generateOutput(ast, lexingResult.groups.Comment)

}
