
import { Parser } from './parser'
import { IToken } from 'chevrotain/lib/chevrotain'

export interface ASTElement {
    type: 'blockStatement' | 'statement' | 'comment'
    startLine: number
    endLine: number
    elements: IToken[]
    block?: ASTElement[]
    blockStart?: number
}

function firstValue(obj) {
    for (const key in obj) {
        return obj[key]
    }
}


export class Visitor extends Parser.getBaseCstVisitorConstructor() {
    constructor() {
        super()
        this.validateVisitor()
    }

    Statement(ctx): ASTElement {
        const isBlockStatement = !!ctx.Block
        if (isBlockStatement) {
            return {
                type: 'blockStatement',
                startLine: ctx.Text[0].startLine,
                endLine: ctx.RCurly[0].startLine,
                elements: [
                    ctx.Text[0],
                    ...(ctx.Argument || []).map(x => this.visit(x)),
                    ctx.LCurly[0],
                ],
                block: this.visit(ctx.Block),
                blockStart: ctx.LCurly[0].startLine
            }
        } else {
            return {
                type: 'statement',
                startLine: ctx.Text[0].startLine,
                endLine: ctx.Semicolon[0].startLine,
                elements: [
                    ctx.Text[0],
                    ...(ctx.Argument || []).map(x => this.visit(x)),
                    ctx.Semicolon[0]
                ],
            }
        }
    }

    Block(ctx) {
        return (ctx.Statement || [])
            .map(x => this.visit(x))
            .concat((ctx.Comment || []).map(x => ({
                type: 'comment',
                startLine: x.startLine - 1,
                endLine: x.endLine - 1,
                elements: [x],
            })))
    }

    Argument(ctx) {
        return firstValue(ctx)[0]
    }

}
