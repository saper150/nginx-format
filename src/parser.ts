import { AllTokens } from "./tokenizer"
import * as chevrotain from 'chevrotain'

class ParserClass extends chevrotain.CstParser {
    constructor() {
        super(Object.values(AllTokens))

        this.RULE("Block", () => {

            this.MANY(() => {
                this.OR([
                    { ALT: () => this.SUBRULE((this as any).Statement) },
                    { ALT: () => this.CONSUME(AllTokens.Comment) },
                ])
            })
        })


        this.RULE("Statement", () => {
            this.MANY1(() => {
                this.SUBRULE((this as any).Argument)
            })
            this.OR([
                {
                    ALT: () => {
                        this.CONSUME(AllTokens.Semicolon);
                    }
                },
                {
                    ALT: () => {
                        this.CONSUME(AllTokens.LCurly)
                        this.SUBRULE((this as any).Block)
                        this.CONSUME(AllTokens.RCurly)
                    }
                }
            ])
        })

        this.RULE("Argument", () => {
            this.OR([
                { ALT: () => this.CONSUME(AllTokens.Text) },
                { ALT: () => this.CONSUME(AllTokens.StringLiteral) },
                { ALT: () => this.CONSUME(AllTokens.StringLiteral2) },
            ])
        })

        this.performSelfAnalysis()
    }
}

export const Parser = new ParserClass()