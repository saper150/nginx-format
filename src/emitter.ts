import { ASTElement } from "./visitor"
import { IToken } from "chevrotain"
import { IFormatingOptions } from "."


function lastElement<T>(arr: T[]): T {
    return arr[arr.length - 1]
}

export class FormatedEmitter {

    constructor(private options: Required<IFormatingOptions>) { }

    private commentsMap = new Map<number, IToken>()
    private lastCommentLine = 0

    private groupCommentsByLine(comments: IToken[]) {
        this.lastCommentLine = 0
        for (const comment of comments) {
            this.commentsMap.set(comment.startLine, comment)
            if (this.lastCommentLine < comment.startLine) {
                this.lastCommentLine = comment.startLine
            }
        }
    }

    private generateIndent(level: number) {
        return this.options.indent.repeat(level)
    }

    private addComments({ comments, level, lastLine }: { comments: IToken[]; level: number; lastLine: number }) {
        let res = ''
        for (const comment of comments) {
            let lineDiff = comment.startLine - lastLine
            lastLine = comment.endLine
            res += this.options.newLineSeparator.repeat(lineDiff)
            res += this.generateIndent(level) + comment.image
        }
        return res
    }

    generateOutput(ast: ASTElement[], comments: IToken[]) {

        this.groupCommentsByLine(comments)

        const configStart = ast.length ? ast[0].startLine : 0

        const commentsBeforeConfig = this.getCommentsBetweenLines(1, configStart - 1)

        let blocksResult = this.addComments({ comments: commentsBeforeConfig, level: 0, lastLine: 1 })

        const lastLeadingCommentLine = commentsBeforeConfig.length
            ? lastElement(commentsBeforeConfig).startLine
            : 1

        blocksResult += this.block(ast, 0, lastLeadingCommentLine)

        const commentsAfterConfig = this.getCommentsBetweenLines(
            ast.length ? lastElement(ast).endLine + 1 : 1,
            this.lastCommentLine,
        )

        let lastLine = ast.length ? lastElement(ast).endLine : 1
        blocksResult += this.addComments({ comments: commentsAfterConfig, level: 0, lastLine })
        return blocksResult
    }

    private getCommentsBetweenLines(start: number, end: number) {
        const res: IToken[] = []
        for (let i = start; i < end + 1; i++) {
            const comment = this.commentsMap.get(i)
            if (comment) {
                res.push(comment)
            }
        }
        return res
    }

    private breakOnComment(statement: ASTElement, comments: IToken[]): IToken[][] {

        const withComments = statement.elements.concat(comments).sort((a, b) => {
            return a.startLine - b.startLine
        })

        const groups: IToken[][] = []
        let workingArr: IToken[] = []

        for (let i = 0; i < withComments.length; i++) {
            const el = withComments[i]

            if (el.tokenType.name === 'Comment') {

                if (workingArr.length
                    && workingArr[workingArr.length - 1].startLine === el.startLine
                ) {
                    workingArr.push(el)
                    groups.push(workingArr)
                    workingArr = []
                } else {
                    groups.push(workingArr)
                    workingArr = []

                    groups.push([el])
                }

            } else {
                workingArr.push(el)
            }
        }

        groups.push(workingArr)
        return groups.filter(x => x.length)
    }


    private statement(statement: ASTElement, level: number) {
        switch (statement.type) {
            case 'blockStatement':
                return this.blockStatementRule(statement, level)
            case 'statement':
                return this.simpleStatement(statement, level)
            case 'comment':
                return statement.elements[0].image
        }
    }

    private block(ast: ASTElement[], level: number, lastLine: number) {
        let res = ''
        for (const el of ast) {
            let lineDiff = el.startLine - lastLine
            const freeComments = this.getCommentsBetweenLines(
                lastLine + 1,
                el.startLine - 1,
            )

            res += this.addComments({ comments: freeComments, level, lastLine })

            if (freeComments.length) {
                lastLine = lastElement(freeComments).startLine
            }

            lineDiff = el.startLine - lastLine
            lastLine = el.endLine
            res += this.options.newLineSeparator.repeat(lineDiff)
            res += this.statement(el, level)
        }

        return res
    }

    private joinSemicolonToPreviousElement(groups: IToken[][]) {

        const lastGroup = groups[groups.length - 1]
        const semicolonIndex = lastGroup.findIndex(x => x.tokenType.name === 'Semicolon')
        if (semicolonIndex > 0) {
            lastGroup.splice(semicolonIndex, 1)
            lastGroup[semicolonIndex - 1].image += ';'
        }
    }


    private breakToLongLines(groups: IToken[][]) {

        const groupSize = (group: IToken[]) => group.map(x => x.image).join(' ').length

        const joinCommentToLastArgument = (group: IToken[]) => {
            if (lastElement(group).tokenType.name === 'Comment') {
                const comment = lastElement(group)
                group.splice(group.length - 1, 1)
                lastElement(group).image += ' ' + comment.image
            }
        }

        const newGroups = []

        const firstGroup = groups[0]

        if (groupSize(firstGroup) > this.options.maxStatementLength) {
            joinCommentToLastArgument(firstGroup)
            newGroups.push([firstGroup[0], firstGroup[1]].filter(x => x))
            newGroups.push(...firstGroup.slice(2).map(x => [x]))
        } else {
            newGroups.push(firstGroup)
        }


        for (const group of groups.slice(1)) {
            if (groupSize(group) > this.options.maxStatementLength) {
                joinCommentToLastArgument(group)
                newGroups.push(...group.map(x => [x]))
            } else {
                newGroups.push(group)
            }
        }

        return newGroups

    }

    private simpleStatement(statement: ASTElement, level: number) {

        let groups = this.breakOnComment(
            statement,
            this.getCommentsBetweenLines(
                statement.startLine,
                statement.endLine,
            )
        )
        this.joinSemicolonToPreviousElement(groups)

        groups = this.breakToLongLines(groups)

        return [
            this.generateIndent(level) + groups[0].map(x => x.image).join(' '),
            ...groups.slice(1).map(
                group => this.generateIndent(level + 1) + group.map(x => x.image).join(' ')
            )
        ].join(this.options.newLineSeparator)

    }

    private blockStatementRule(statement: ASTElement, level: number) {

        const groups = this.breakOnComment(
            statement,
            this.getCommentsBetweenLines(
                statement.startLine,
                statement.blockStart,
            )
        )

        let res = groups.filter(x => x.length).map(
            group => this.generateIndent(level) + group.map(x => x.image).join(' ')
        ).join(this.options.newLineSeparator)

        res += this.block(statement.block, level + 1, statement.blockStart)

        let lastLine = lastElement(statement.block) ? lastElement(statement.block).endLine : statement.blockStart

        if (statement.block.length) {
            const endBlockComments = this.getCommentsBetweenLines(
                lastElement(statement.block).endLine + 1,
                statement.endLine - 1
            )
            lastLine = lastElement(endBlockComments) ? lastElement(endBlockComments).startLine : lastLine

            res += this.addComments({
                comments: endBlockComments,
                level: level + 1,
                lastLine: lastElement(statement.block).startLine
            })
        }

        res += this.options.newLineSeparator.repeat(statement.endLine - lastLine - 1)


        const blockEndComment = this.commentsMap.get(statement.endLine)

        res += this.options.newLineSeparator + this.generateIndent(level) + '}' + (blockEndComment ? ' ' + blockEndComment.image : '')
        return res
    }

}
