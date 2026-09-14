import AudioPlayer, { audioPlayerProps } from './AudioPlayer';
import AudioSlider, { audioSliderProps, audioSliderEmits } from './audioSlider';
import { formatTime } from './utils';

export { AudioPlayer, AudioSlider, audioPlayerProps, audioSliderProps, audioSliderEmits, formatTime };
export type { AudioUrl } from './AudioPlayer';
export default AudioPlayer;
