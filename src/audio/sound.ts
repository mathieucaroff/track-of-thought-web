import clickUrl from 'url:../../asset/sound/click.mp3'
import errorUrl from 'url:../../asset/sound/error.mp3'

let createAudioManager = (url) => {
  let audioArray = Array.from({ length: 10 }, () => new Audio(url))

  let k = 0
  return {
    play: () => {
      audioArray[k].play()
      k = (k + 1) % audioArray.length
    },
  }
}

export const clickSound = createAudioManager(clickUrl)
export const errorSound = createAudioManager(errorUrl)
