import { ASTElement } from "./visitor"
import { IToken } from "chevrotain"
import { IFormatingOptions } from "."

export class FormatedEmitter {

    constructor(private options: Required<IFormatingOptions>) {}

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

    generateOutput(ast: ASTElement[], comments: IToken[]) {
        this.groupCommentsByLine(comments)
        let blocksResult = this.block(ast, 0, 1)


        const commentsAfterConfig = this.getCommentsBetweenLines(
            ast.length ? ast[ast.length - 1].endLine + 1 : 1,
            this.lastCommentLine,
        )

        let lastLine = ast.length ? ast[ast.length - 1].endLine : 1
        for (const comment of commentsAfterConfig) {

            let lineDiff = comment.startLine - lastLine
            lastLine = comment.endLine
            blocksResult += '\n'.repeat(lineDiff)
            blocksResult += comment.image
        }

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
                lastLine + (level === 0 ? 0 : 1),
                el.startLine - 1,
            )


            for (const comment of freeComments) {
                lineDiff = comment.startLine - lastLine
                lastLine = comment.startLine
                res += '\n'.repeat(lineDiff)
                res += this.generateIndent(level) + comment.image
            }
            lineDiff = el.startLine - lastLine
            lastLine = el.endLine
            res += '\n'.repeat(lineDiff)
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
            if(group[group.length - 1].tokenType.name === 'Comment') {
                const comment = group[group.length - 1]
                group.splice(group.length - 1, 1)
                group[group.length - 1].image += ' ' + comment.image
            }
        }

        const newGroups = []

        const firstGroup = groups[0]

        if(groupSize(firstGroup) > this.options.maxStatementLength) {
            joinCommentToLastArgument(firstGroup)
            newGroups.push([firstGroup[0], firstGroup[1]].filter(x => x))
            newGroups.push(...firstGroup.slice(2).map(x => [x]))
        } else {
            newGroups.push(firstGroup)
        }


        for(const group of groups.slice(1)) {
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
        ].join('\n')

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
            group => this.generateIndent(level).repeat(level) + group.map(x => x.image).join(' ')
        ).join('\n')

        res += this.block(statement.block, level + 1, statement.blockStart)

        const blockEndComment = this.commentsMap.get(statement.endLine)

        res += '\n' + this.generateIndent(level) + '}' + (blockEndComment ? ' ' + blockEndComment.image : '')
        return res
    }

}
