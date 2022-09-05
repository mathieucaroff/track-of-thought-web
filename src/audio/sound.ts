import clickUrl from 'url:../../asset/sound/click.mp3'
import errorUrl from 'url:../../asset/sound/error.mp3'
export const clickSound = () => new Audio(clickUrl)
export const errorSound = () => new Audio(errorUrl)

clickSound()
errorSound()
