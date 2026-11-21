import clickUrl from '../../asset/sound/click.mp3?url'
import errorUrl from '../../asset/sound/error.mp3?url'

let createAudioManager = (url: string) => {
  let audioArray = Array.from({ length: 10 }, () => new Audio(url))

  let k = 0
  return {
    play: () => {
      // play() rejects when the browser blocks audio; that must not be an
      // unhandled rejection
      audioArray[k].play()?.catch(() => {})
      k = (k + 1) % audioArray.length
    },
  }
}

export const clickSound = createAudioManager(clickUrl)
export const errorSound = createAudioManager(errorUrl)
