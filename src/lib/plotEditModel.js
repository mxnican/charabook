import icon1 from '../assets/images/icon1.png'
import icon2 from '../assets/images/icon2.png'
import icon3 from '../assets/images/icon3.png'
import icon4 from '../assets/images/icon4.png'
import icon5 from '../assets/images/icon5.png'
export * from './plotEditModelCore'

const TYPE_META = [
  {
    id: 'scene',
    label: '场景',
    background: '#f2f6fe',
    border: '#83a8fa',
    text: '#83a8fa',
    icon: icon1,
  },
  {
    id: 'action',
    label: '动作',
    background: '#f3f8f3',
    border: '#6cac71',
    text: '#6cac71',
    icon: icon2,
  },
  {
    id: 'expression',
    label: '表情',
    background: '#fcf4f4',
    border: '#c88b9f',
    text: '#c88b9f',
    icon: icon3,
  },
  {
    id: 'shot',
    label: '分镜',
    background: '#f5f4fa',
    border: '#ac91e0',
    text: '#ac91e0',
    icon: icon4,
  },
  {
    id: 'dialogue',
    label: '台词',
    background: '#fef9ee',
    border: '#f5bc63',
    text: '#f5bc63',
    icon: icon5,
  },
]

const TYPE_MAP = new Map(TYPE_META.map((item) => [item.id, item]))

export function getPlotCardType(type) {
  return TYPE_MAP.get(type) || TYPE_MAP.get('scene')
}

export function getPlotCardTypeList() {
  return TYPE_META
}
