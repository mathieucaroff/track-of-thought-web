import { Theme, toHtmlColor } from './color'
import { Layout } from './layout'
import { create } from './lib/create'

export function createScore(
  totalTrainCount: number,
  container: HTMLElement,
  layout: Layout,
  theme: Theme,
  onGameEnd: () => void,
) {
  let trainCount = 0
  let goodTrainCount = 0

  const getScoreText = () => {
    let difference = trainCount - goodTrainCount
    let text = `${goodTrainCount} / ${trainCount} (-${difference})`
    return text
  }
  const getAssessment = () => {
    let assessment = ''
    let difference = trainCount - goodTrainCount
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

  // Show score to the user
  const showScore = () => {
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
  }

  return {
    trainArrival(goodTrain: boolean) {
      trainCount += 1
      if (goodTrain) {
        goodTrainCount += 1
      }
      scoreSpan.textContent = getScoreText()
      if (trainCount >= totalTrainCount) {
        showScore()
        onGameEnd()
      }
    },
  }
}

export type Score = ReturnType<typeof createScore>
