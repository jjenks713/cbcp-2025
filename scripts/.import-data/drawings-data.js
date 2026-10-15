const drawingsData = [
    {
        url: '/images/3-amigos.jpg',
        name: 'Three Amigos',
        med: 'Sanded Acrylic and Charcoal',
        size: '12”x16”',
        val: '1'
    },
    {
        url: '/images/Arrow.jpg',
        name: 'Arrow',
        med: 'Ballpoint Pen Drawing',
        size: '8”x10”',
        val: '2'
    },
/*     {
        url: '/images/Depression.gif',
        name: 'Depression',
        med: 'Digital Gif',
        size: '',
        val: '3'
    }, */
    {
        url: '/images/Drift.jpg',
        name: 'Drift',
        med: 'Graphite and Ink on Stonehenge',
        size: '18”x24”',
        val: '4'
    },
    {
        url: '/images/girl-profile.jpg',
        name: 'Girl Profile',
        med: 'Sanded Acrylic Paint and Charcoal',
        size: '15”x22”',
        val: '5'
    },
    {
        url: '/images/harlot-banner.jpg',
        name: 'Harlot’s Calamity Lyric Banner',
        med: 'Digital Drawing',
        size: '',
        val: '6'
    },
    {
        url: '/images/Rita.jpg',
        name: 'Rita',
        med: 'Copic Markers and Gel Pens',
        size: '6”x8”',
        val: '7'
    },
    {
        url: '/images/Nyx.jpg',
        name: 'Nyx',
        med: 'Copic Markers and Gel Pens',
        size: '6”x8”',
        val: '8'
    },
    {
        url: '/images/bear.png',
        name: 'Bear',
        med: 'Wood Burning on Cutting Board',
        size: '',
        val: '9'
    },
    {
        url: '/images/boar.png',
        name: 'Wild Boar',
        med: 'Wood Burning',
        size: '24”x36”',
        val: '10'
    },
    {
        url: '/images/for-hideo.jpg',
        name: 'For Hideo',
        med: 'Copic Markers and Gel Pens',
        size: '8”x10”',
        val: '11'
    },
    {
        url: '/images/girl-1.jpg',
        name: 'Girl 1',
        med: 'Charcoal on Gray Paper',
        size: '9”x11”',
        val: '12'
    },
    {
        url: '/images/music.jpg',
        name: 'Music',
        med: 'Digital Drawing',
        size: '',
        val: "13"
    },
    {
        url: '/images/Yue.jpg',
        name: 'Yue',
        med: 'Acrylic Painting',
        size: '',
        val: "15"
    },
/*     {
        url: '/images/optimism.gif',
        name: 'Optimism',
        med: 'Digital GIF',
        size: '',
        val: "16"
    },
    {
        url: '/images/pessimism.gif',
        name: 'Pessimism',
        med: 'Digital GIF',
        size: '',
        val: "17"
    }, */
    {
        url: '/images/girl-2.jpg',
        name: 'Girl 2',
        med: 'Charcoal on Gray Paper',
        size: '9”x11”',
        val: "18"
    },
    {
        url: '/images/girl-3.jpg',
        name: 'Girl 3',
        med: 'Charcoal on Gray Paper',
        size: '9”x11”',
        val: "19"
    },
    {
        url: '/images/heart.png',
        name: 'Heart',
        med: 'Oil Painting',
        size: '18”x24”',
        val: "20"
    },
    {
        url: '/images/i-love-you.jpeg',
        name: 'I Love You',
        med: 'Oil Painting',
        size: '',
        val: "21"
    },
    {
        url: '/images/img.jpg',
        name: 'Spidey Venom',
        med: 'Acrylic Painting',
        size: '16”x20”',
        val: "22"
    },
    {
        url: '/images/jose.jpg',
        name: 'Jose',
        med: 'Copic Markers and Gel Pens',
        size: '8”x10”',
        val: "23"
    },
    {
        url: '/images/ruby.jpg',
        name: 'Ruby Rose',
        med: 'Graphite on Stonehenge',
        size: '9”x11”',
        val: "24"
    },
    {
        url: '/images/shop.jpg',
        name: 'Shop Till You Drop',
        med: 'Collage and Acrylic on Plywood Box',
        size: '6”x6”',
        val: "25"
    },
    {
        url: '/images/skull-study.jpg',
        name: 'Skull Study',
        med: 'Graphite on Stonehenge',
        size: '14”x20”',
        val: "26"
    },
    {
        url: '/images/skull.jpg',
        name: 'Skull',
        med: 'Graphite and Ink on Stonehenge',
        size: '24”x18”',
        val: "27"
    },
    {
        url: '/images/slithery.jpg',
        name: 'Slithery Little Snake',
        med: 'Sanded Acrylic and Charcoal',
        size: '12”x36”',
        val: "28",
    },
    {
        url: '/images/tied-up.jpg',
        name: 'Tied Up',
        med: 'Acrylic and Charcoal',
        size: '10.5”x17.5”',
        val: "29"
    },
    {
        url: '/images/miles.jpg',
        name: 'Miles',
        med: 'Copic Markers and Gel Pens',
        size: '8”x10”',
        val: "30"
    },
    {
        url: '/images/mothers-love.jpg',
        name: 'Mothers Love',
        med: 'Pastels and Ink',
        size: '18”x14”',
        val: "31"
    },
    {
        url: '/images/the-godfather.jpg',
        name: 'The Godfather',
        med: 'Acrylic Painting',
        size: '12”x16”',
        val: "32"
    },
    {
        url: '/images/insecure.jpg',
        name: 'Insecure Exposure',
        med: 'Charcoal, Chalk Pastels, and Acrylic Paint',
        size: '44”x30”',
        val: "33"
    },
    {
        url: '/images/jack-sally.jpg',
        name: 'Jack and Sally',
        med: 'Oil Paint',
        size: '',
        val: "34"
    },
    {
        url: '/images/kid-knot.jpg',
        name: 'I Kid You Knot',
        med: 'Acrylic and Charcoal',
        size: '22”x30”',
        val: "35"
    },
    {
        url: '/images/modern-living.jpg',
        name: 'Modern Living',
        med: 'Chalk Pastels and Acrylic Paint',
        size: '30”x44”',
        val: "36"
    },
    {
        url: '/images/rose.jpg',
        name: 'Rose',
        med: 'Charcoal Drawing',
        size: '8”x10”',
        val: "37"
    },
    {
        url: '/images/too-late.jpg',
        name: 'It’s Too Late to Apologize',
        med: 'Sanded Acrylic and Charcoal',
        size: '12”x16”',
        val: "38"
    },
    {
        url: '/images/V.jpg',
        name: 'V',
        med: 'Charcoal Drawing',
        size: '8”x10”',
        val: "39"
    },
    {
        url: '/images/wonderboom-1.jpg',
        name: 'Wonderboom Ad 1',
        med: 'Charcoal Drawing, Digital Ad',
        size: '',
        val: "40"
    },
    {
        url: '/images/wonderboom-2.jpg',
        name: 'Wonderboom Ad 2',
        med: 'Charcoal Drawing, Digital Ad',
        size: '',
        val: "41"
    },
    {
        url: '/images/Wood.jpg',
        name: 'Wood',
        med: 'Graphite and Ink on Stonehenge',
        size: '18”x24”',
        val: "42"
    }
]
module.exports = { drawingsData };
