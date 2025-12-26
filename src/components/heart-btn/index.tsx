import HeartUnlikedSVG from './heart-unliked.svg'
import HeartLikedSVG from './heart-liked.svg'

interface Props {
	liked: boolean
}

export default function HeartBtn({ liked }: Props) {
	return liked ? <HeartLikedSVG /> : <HeartUnlikedSVG />
}
