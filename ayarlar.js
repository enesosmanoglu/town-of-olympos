const fs = require('fs');
const moment = require("moment");
moment.locale("tr");

exports.prefix = "too!"
exports.sunucu = "667115809449050150" // OLYMPOS: 606027252362379294 // TEST: 667115809449050150

exports.yetkili_ids = [
  "208196116078919680", // jamie
  "133191597683638273", // ria 
]

exports.olympos = {
  prefix: "o2!",
  channelName: "botlar-arası",
  commands: {
    addPoint: "oyunrankpuanekle",
  },
}

exports.oyunAyarları = {
  minKişi: 2,
  maxKişi: 15,
  rolOkumaSüresi: 5, // saniye
  oyuncuBeklemeSüresi: 180, // saniye
}

exports.createTooGame = () => {
  return {
    id: 0,
    timestamps: { // Zaman dilimleri
      lastPlayerJoined: parseInt(moment().utcOffset(3).format('x')), // En son giren kişinin katılma zamanı
      created: parseInt(moment().utcOffset(3).format('x')), // Oyun oluşturuldu.
      starting: 0, // Roller dağıtıldı. Oyun başlamasına 1 dakika.
      started: 0, // Oyun başladı.
      finished: 0, // Oyun bitti.
    },
    mode: 0, // Yöneticili mod: 0 // Otomatik mod: 1
    day: {
      current: 0, // Gece:0 | Gündüz: 1 
      count: 0, // Toplam geçen gün sayısı.
    },
    ownerID: 0, // Oyunu oluşturan kişinin ID'si
    gameRoom: null, // Oyun ses odası // Fonksiyonlar db'de siliniyor!!
    message: null, // Oyun oluşturma bilgi mesajı // Fonksiyonlar db'de siliniyor!!
    embed: null, // Oyun oluşturma mesajındaki embed // Fonksiyonlar db'de siliniyor!!
    guild: null, // Oyunun oluşturulduğu sunucu // Fonksiyonlar db'de siliniyor!!
    players: [], // Tüm oyuncuların ID'leri. Yöneticili modda oyun kurucu bu listede yer almaz.
    roles: {}, // Role: [user_id,user_id...] // Tüm oyuncuların Rol ve ID eşleşmesi.
    alive: {}, // user_id: Role // Hayattaki oyuncuların ID ve Rol eşleşmesi.
    dead: {}, // user_id: Role // Ölmüş oyuncuların ID ve Rol eşleşmesi.
    hangs: {}, // user_id: Role 
    lastDeaths: {}, // user_id: killerRole // Önceki gece öldürülen kişilerin ID ve öldüren kişinin Rol'ü eşleşmesi.
    lastEvents: {}, // user_id: {exLimit, exSelfLimit, skills.selectedID, skills.selectedID1, skills.selectedID2} 
    notes: {}, // user_id: note // Tüm oyuncuların geceleri aldığı notlar.
    votes: {}, // voted_user_id: [user_id,user_id...] // Son oylamada verilen oy ve veren kişilerin eşleşmesi.
    list: {}, // user_id: [user_id,user_id...] // Gece seçme listesi id'ler
    isVoting: false, // Oylama yapılıyor mu?
    isStarting: false, // Oyun rol okuma moduna girdi mi?
    isStarted: false, // Oyun başladı mı?
    isFinished: false, // Oyun bitti mi?
    infoMessages: [],
    roleProps: { // Role: {bla: bla, bla: bla}
      Zeus: {
        isProtected: true, // Üzerinde gece ölüm koruması var mı?
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        killer: true, // Öldürme yeteneği varsa true, yoksa false.
        limit: -1, // Yeteneklerini kullanabilme hakkı. (-1: sınırsız/her gece)
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur.
          selectedID: 0, //  en son seçtiği kişi.
        }
      },
      Poseidon: {
        isProtected: true, // Üzerinde gece ölüm koruması var mı?
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        killer: true, // Öldürme yeteneği varsa true, yoksa false.
        limit: -1, // Yeteneklerini kullanabilme hakkı. (-1: sınırsız/her gece)
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur.
          selectedID: 0, // zeus yoksa en son seçtiği kişi.
        }
      },
      Hades: {
        isProtected: true, // Üzerinde gece ölüm koruması var mı?
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        killer: true, // Öldürme yeteneği varsa true, yoksa false.
        limit: -1, // Yeteneklerini kullanabilme hakkı. (-1: sınırsız/her gece)
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur. 
          selectedID: 0, // en son tehdit ettiği kişi.
        }
      },
      Ares: {
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        killer: true, // Öldürme yeteneği varsa true, yoksa false.
        limit: -1, // Yeteneklerini kullanabilme hakkı. (-1: sınırsız/her gece)
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur.
          selectedID: 0, // seçtiği kişi.
        }
      },
      Aphrodite: {
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        limit: -1, // Yeteneklerini kullanabilme hakkı. (-1: sınırsız/her gece)
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur. 
          selectedID1: 0, // seçtiği kişi 1.
          selectedID2: 0, // seçtiği kişi 2.
        }
      },
      Dionysos: { // tek amacı kendini astırmaktır. ayrı bir özelliği yoktur.
      },
      Apollo: {
        onlySelf: true, // Yeteneklerini sadece kendi üzerinde mi kullanabilir?
        includeSelf: true, // Yeteneklerini kendi üzerinde kullanabilir mi?
        selfLimit: 3, // Yeteneklerini kendine kullanabilme hakkı.
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur. her gece sıfırlanır. koruma hakkı bittiyse sıfırlanmaz.
          selectedID: 0, // en son koruduğu kişi.
        }
      },
      Hera: {
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        limit: -1, // Yeteneklerini kullanabilme hakkı. (-1: sınırsız/her gece)
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur.
          selectedID: 0, // en son seçtiği kişi.
        }
      },
      Hermes: { // her olayı rapor alır. ayrı bir özelliği yoktur.
      },
      Medusa: {
        onlySelf: true, // Yeteneklerini sadece kendi üzerinde mi kullanabilir?
        includeSelf: true, // Yeteneklerini kendi üzerinde kullanabilir mi?
        selfLimit: 3, // Yeteneklerini kendine kullanabilme hakkı.
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur. her gece sıfırlanır. koruma hakkı bittiyse sıfırlanmaz.
          selectedID: 0, // en son seçtiği kişi.
          killVisitor: false, // Ziyaretçiyi öldürür mü?
        }
      },
      Hipokrat: {
        includeSelf: true, // Yeteneklerini kendi üzerinde kullanabilir mi?
        limit: -1, // Yeteneklerini kullanabilme hakkı. (-1: sınırsız/her gece)
        selfLimit: 1, // Yeteneklerini kendine kullanabilme hakkı.
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur. her gece sıfırlanır.
          selectedID: 0, // en son koruduğu kişi.
        }
      },
      Demeter: { // engellediği hareketler hakkında bilgi alır.
        onlySelf: true, // Yeteneklerini sadece kendi üzerinde mi kullanabilir?
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        selfLimit: 2, // Yeteneklerini kullanabilme hakkı.
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur. her gece sıfırlanır. engel hakkı bittiyse sıfırlanmaz.
          selectedID: 0, // zeus yoksa en son seçtiği kişi.
        }
      },
      Athena: {
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        limit: -1, // Yeteneklerini kullanabilme hakkı. (-1: sınırsız/her gece)
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur. her gece sıfırlanır. engel hakkı bittiyse sıfırlanmaz.
          selectedID: 0, // en son sorguladığı kişi.
          killSelected: false, // sorguladığı kişiyi öldürecek mi?
        }
      },
      Pegasus: {
        onlyDeads: true,
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        limit: 2, // Yeteneklerini kullanabilme hakkı.
        skills: {
          canUse: true, // yeteneğini kullandıktan sonra false olur. her gece sıfırlanır. engel hakkı bittiyse sıfırlanmaz.
          selectedID: 0, // en son canlandırdığı kişi.
        }
      },
      Artemis: {
        includeSelf: false, // Yeteneklerini kendi üzerinde kullanabilir mi?
        limit: 3, // Yeteneklerini kullanabilmesi için kalan hak.
        suicide: false, // O gece intihar edecek mi?
        skills: {
          canUse: true, // Yeteneğini kullanabilir mi?
          selectedID: 0, // Yeteneğini kullanmak için seçtiği kişinin ID'si.
        }
      },
    },
  }
}

exports.rolPaketleri = {
  15: ["Zeus", "Poseidon", "Hades", "Ares", "Aphrodite", "Dionysos", "Apollo", "Hera", "Hermes", "Medusa", "Hipokrat", "Demeter", "Athena", "Pegasus", "Artemis"],
  5: ["Demeter", "Zeus", "Poseidon", "Medusa", "Hermes"],
  4: ["Demeter", "Artemis", "Poseidon", "Medusa"],
  3: ["Zeus", "Ares", "Aphrodite"],
  "büyükTanrılar": ["Zeus", "Poseidon", "Hades"],
}

exports.sınıflandırma = {
  "kötü": ["Zeus", "Poseidon", "Hades"],
  "iyi": ["Hera", "Hermes", "Medusa", "Hipokrat", "Demeter", "Athena", "Pegasus", "Artemis"],
  "tarafsız": ["Ares", "Aphrodite", "Dionysos", "Apollo"],
}

exports.rolResimleri = {
  Zeus: "https://i.hizliresim.com/DH1NIf.png",
  Poseidon: "https://i.hizliresim.com/itoBfG.png",
  Hades: "https://i.hizliresim.com/AX9Zow.png",
  Ares: "https://i.hizliresim.com/AUrs5t.png",
  Aphrodite: "https://i.hizliresim.com/Z7a2Kh.png",
  Dionysos: "https://i.hizliresim.com/mkCLCm.png",
  Apollo: "https://i.hizliresim.com/9gTv77.png",
  Hera: "https://i.hizliresim.com/dmXEqf.png",
  Hermes: "https://i.hizliresim.com/A1CAdy.png",
  Medusa: "https://i.hizliresim.com/yj4PHT.png",
  Hipokrat: "https://i.hizliresim.com/1arxUN.png",
  Demeter: "https://i.hizliresim.com/kEHfdE.png",
  Athena: "https://i.hizliresim.com/xH9wOj.png",
  Pegasus: "https://i.hizliresim.com/aLjYFs.png",
  Artemis: "https://i.hizliresim.com/OAjDQh.png",
}

rolBilgileri = {}
let path = "/app/rolBilgileri/";
fs.readdir(path, (err, files) => {
  if (err) console.error(err);
  files.forEach(f => {
    const bilgi = fs.readFileSync(path + f, 'UTF-8')

    rolBilgileri[f] = bilgi;
  })
})

exports.rolBilgileri = rolBilgileri
