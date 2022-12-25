import { Slate } from './type'

export function isStation(slate: Slate | undefined) {
  return slate && !slate.exit && !slate.otherExit
}

export function isTrack(slate: Slate | undefined) {
  return slate && slate.exit
}

export function isSimpleTrack(slate: Slate | undefined) {
  return slate && slate.exit && !slate.otherExit
}

export function isSwitch(slate: Slate | undefined) {
  return slate && slate.exit && slate.otherExit
}
