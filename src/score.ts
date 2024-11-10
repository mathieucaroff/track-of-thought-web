import { Theme, toHtmlColor } from './color'
import { Layout } from './layout'
import { create } from './lib/create'

export function createScore(container: HTMLElement, layout: Layout, theme: Theme) {
  let totalCount = 0
  let goodCount = 0

  const getScoreText = () => {
    let difference = totalCount - goodCount
    let text = `${goodCount} / ${totalCount} (-${difference})`
    return text
  }
  const getAssessment = () => {
    let assessment = ''
    let difference = totalCount - goodCount
    if (difference === 0) {
      assessment = `Perfect score!`
    } else if (difference <= 2) {
      assessment = `Level complete!`
    }
    return assessment
  }

  let scoreSpan = create('span', {
    style: {
      position: 'fixed',
      padding: '3px 15px',
      height: `${layout.scoreHeight}}px`,
      backgroundColor: toHtmlColor(theme.scoreBackground),
      fontSize: `${layout.scoreHeight}px`,
      userSelect: 'none',
    },
    textContent: getScoreText(),
  })

  container.appendChild(scoreSpan)

  return {
    // Show score to the user
    showScore: () => {
      container.appendChild(
        create(
          'div',
          {
            style: {
              position: 'fixed',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '80px',
              textAlign: 'center',
              padding: '15px 75px',
              backgroundColor: toHtmlColor(theme.scoreBackground),
              border: 'solid 10px #808080',
              userSelect: 'none',
            },
          },
          [
            create('div', { textContent: 'Score:' }),
            create('div', { textContent: getScoreText() }),
            create('div', { textContent: getAssessment() }),
          ],
        ),
      )
    },
    scoreEvent(isGoodEvent: boolean) {
      totalCount += 1
      if (isGoodEvent) {
        goodCount += 1
      }
      scoreSpan.textContent = getScoreText()
    },
  }
}

export type Score = ReturnType<typeof createScore>
