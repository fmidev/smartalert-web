---
title: "SmartAlert — OpenShift-käyttöönotto (dev)"
subtitle: "Käyttöönotto-ohje ja ylläpidon runbook"
date: "25.8.2026"
---

# 1. Tiivistelmä

SmartAlert paketoidaan `fmidev/asi-www-docker-template`n mukaisesti OpenShiftin
dev-ympäristöön. **Yksi image ja yksi Deployment palvelee kaikkia maita**, ja
jokainen maa on oma sivunsa osoitteessa `/<maakoodi>/` — `/ge/`, `/kg/`,
`/ua-sea/` ja niin edelleen.

Ratkaisun kantava periaate: **image ei sisällä minkään maan konfiguraatiota.**
Maakohtainen `capmap-config.js`, CAP-data ja mahdolliset omat ikonit tulevat
verkkolevyltä, jonka käyttöoikeudet hallitaan hakemistotasolla. Näin maiden
konfiguraatiot eivät päädy GitHubiin eikä maa näe toisen maan asetuksia.

Käyttöönotto vaatii neljä asiaa, joita ei voi tehdä repon sisältä: Quay-
repositoryn ja robottitilin, GitHubin secretit, hakemiston
`fmidev/openshift-apps-gitops`-repoon, sekä verkkolevyn. Nämä käydään läpi
luvuissa 5–9.

Olemassa olevat pakettausreitit — Docker Hub / GHCR -image ja RPM — toimivat
entiseen tapaan yhden sivuston asennuksina.

# 2. Nimet ja tunnisteet

Kaksi samankaltaista nimeä tarkoittaa eri asioita:

| Nimi | Mitä tarkoittaa | Missä esiintyy |
|------|-----------------|----------------|
| `smartalert-web` | Sovelluksen nimi OpenShiftissä ja Quayssa | Quay-repo, Helm-release, GitOps-polku, Service, Route |
| `smartalert` | DocumentRootin hakemistonimi kontin sisällä | `/smartmet/www/smartalert`, `conf/httpd/*` |

`smartalert-web` vastaa GitHub-repon nimeä (`fmidev/smartalert-web`), on FMI:n
muiden pak-sovellusten konventio ja on jo GHCR-imagen nimi.

Käyttöönotossa syntyvät tunnisteet:

| Kohde | Arvo |
|-------|------|
| Container image | `quay.io/fmi/smartalert-web:<versio>` |
| Helm-chart (OCI) | `quay.io/fmi/smartalert-web-chart:<versio>` |
| GitOps-hakemisto | `pak/smartalert-web/development/` |
| Ehdotettu Route | `smartalert-web.out.ock.fmi.fi` |

# 3. Arkkitehtuuri

## 3.1 Yksi deployment, monta maata

Maat ovat saman Apache-instanssin polkuja, eivät erillisiä deploymentteja.
Tämä vastaa nykyistä `smartmet-demo.fmi.fi`-mallia.

Vaihtoehto olisi ollut 15 erillistä Helm-releasea. Se hylättiin, koska
templaten oletusresurssit ovat 1 Gi requests ja 5 Gi limits podia kohti — 15
podilla noin 15 Gi requests ja 75 Gi limits pelkälle dev-ympäristölle.

## 3.2 Mikä on imagessa, mikä levyllä

| Imagessa (GitHub) | Levyllä (ei GitHubissa) |
|-------------------|-------------------------|
| `js/ css/ img/ i18n/` | `sites/<cc>/capmap-config.js` |
| `list.php capfeed.php lastUpdated.php capsite.php` | `sites/<cc>/data/` |
| `site.html` (kaikille yhteinen karttasivu) | `sites/<cc>/img/` (vain ne ikonit jotka eroavat oletuksesta) |
| `index.php` (etusivu) | `sites/<cc>/locations.js` (jos omat sijainnit) |
| `capatom.xsl ethiopian_calendar.js cap-logo.png` | |

Levy mountataan polkuun `/smartmet/www/smartalert/sites`. Maat löydetään
sieltä **ajonaikaisesti**, joten maan lisääminen ei vaadi uutta imagea eikä
edes Helm-muutosta.

## 3.3 Reititys

Symlinkkejä ei voi käyttää, koska levy on read-only. Sen sijaan
`conf/httpd/sites.conf` ohjaa jokaisen maan polun `AliasMatch`-säännöillä:
maakohtaiset tiedostot levyltä, kaikki muu jaetusta koodista. Säännöt on
järjestetty niin, että maakohtaiset osuvat ensin.

Suora pääsy polkuun `/sites/` on estetty, joten maan hakemistoon pääsee vain
sen oman etuliitteen kautta.

## 3.4 Kielivalinta

Aiemmin kielet määriteltiin `index.html`:n `<script>`-riveillä, mikä pakotti
maakohtaisen HTML-tiedoston. Nyt ne tulevat konfiguraatiosta:

```javascript
languages: ['ka-GE', 'en-GE'],
```

Jaettu `site.html` lataa tiedostot `i18n/translations-<kieli>.js` tässä
järjestyksessä (`async = false`, joten suoritusjärjestys säilyy). **Listan
järjestys on myös pudotusvalikon järjestys**, koska valikko rakennetaan
`translations`-objektin avainten järjestyksessä.

Näin levyltä tulee pelkkää dataa, ei HTML:ää — levylle pääsyä ei voi käyttää
mielivaltaisen JavaScriptin ajamiseen FMI:n domainissa.

## 3.5 Omat ikonit

Oletusikonit ovat imagen `img/`-hakemistossa ja niitä käytetään aina, ellei
konfiguraatiossa ole `customIcons: true`.

Kun maalla on omat ikonit, ne tulevat levyltä hakemistosta `<cc>/img/` —
konfiguraatiotiedoston vierestä. **Maan tarvitsee toimittaa vain ne ikonit
jotka oikeasti eroavat oletuksesta.** Puuttuvat haetaan automaattisesti
jaetusta oletussarjasta.

Tämä on muutos aiempaan tapaan, jossa koko oletussarja kopioitiin käsin
`custom/`-hakemiston alle. Nykyisistä sivuista haetuista 318 ikonitiedostosta
vain 106 erosi oletuksesta — loput 212 olivat turhia kopioita, jotka nyt on
karsittu pois.

Käytännön etu: kun jaettuun `img/`-hakemistoon lisätään uusi oletusikoni, se
tulee käyttöön kaikille maille ilman että levylle tarvitsee koskea.

Toteutus on `siteicon.php`, jonne `conf/httpd/sites.conf` ohjaa polun
`/<cc>/img/custom/*`. URL-polussa säilyy `custom/`, koska `capmap.js` muodostaa
sen — levyllä sitä ei tarvita. Käsittelijä käyttää `mod_alias`ia eikä
`mod_rewrite`ia: server-kontekstiin asetetut rewrite-säännöt eivät periydy
virtual hostiin, aliakset periytyvät.

## 3.6 Datapolun ratkaisu

Endpointit ovat yksi jaettu tiedosto, joten `__DIR__` osoittaisi väärään
paikkaan. `capsite.php` päättelee sivuston pyynnön URL-polusta:

- `/ge/list.php` → `<DocumentRoot>/sites/ge`
- `/list.php` → `<DocumentRoot>` (vanha yhden sivuston asennus, ennallaan)

Ratkaisu tarkistaa `realpath`illa, että lopputulos pysyy DocumentRootin sisällä.

# 4. Tiedostorakenne

```
list.php capfeed.php lastUpdated.php    jaetut endpointit
capsite.php                             sivuston päättely URL:sta
siteicon.php                            maan oma ikoni tai jaettu oletus
index.html                              karttasivu (imagessa -> site.html)
capmap-config.js                        vain vanhan asennuksen oletusconfig
js/ css/ img/ i18n/ capatom.xsl         jaetut assetit
ethiopian_calendar.js locations.js cap-logo.png

openshift/
  index.php                             etusivu, listaa maat levyltä
  node-health-status/index.php          terveystarkistus

conf/httpd/sites.conf                   maiden reititys
conf/httpd/*                            muut Apache-asetukset
conf/helm/                              Helm-chart

sites/                                  EI GITISSÄ - paikallinen peili levystä

Dockerfile                              OpenShift / Quay
Dockerfile.dockerhub                    vanha docker.io / GHCR (ennallaan)
smartalert-web.spec                     RPM (ennallaan)
```

## 4.1 Tärkeää: `sites/` ei ole versionhallinnassa

Työpuun hakemistossa `sites/` on 15 maan valmiit konfiguraatiot ja neljän maan
omat ikonit. Se on `.gitignore`ssa, joten **se ei säily gitissä eikä selviä
työpuun siivoamisesta**.

Kopioi sisältö verkkolevylle heti kun levy on olemassa (luku 9), tai ota siitä
talteen kopio sitä ennen:

```bash
tar czf ~/smartalert-sites.tar.gz -C /polku/repoon sites
```

Sisältö on alun perin haettu nykyisiltä `smartmet-demo.fmi.fi`-sivuilta, joten
se on tarvittaessa haettavissa uudelleen sieltä.

# 5. Vaihe 1 — Quay

1. Luo repository **`fmi/smartalert-web`**. Näkyvyys samaksi kuin muilla
   pak-sovelluksilla.
2. Helm-chart menee samaan nimiavaruuteen nimellä
   **`fmi/smartalert-web-chart`**. Quay luo sen yleensä automaattisesti
   ensimmäisellä pushilla.
3. Luo tai valitse **robottitili**, jolla on `write`-oikeus molempiin. Ota
   talteen tunnus ja token.
4. Varmista, että klusterin **`fmi-openshift-pull-secret`** pääsee lukemaan
   repositorya. Jos image jää `ImagePullBackOff`-tilaan, tämä on ensimmäinen
   tarkistettava asia.

# 6. Vaihe 2 — GitHubin secretit ja muuttujat

Repossa `fmidev/smartalert-web`: **Settings → Secrets and variables → Actions**.

## 6.1 Miksi näitä tarvitaan

Julkaisu ajetaan GitHubin runnerilla, jolla ei ole valmiiksi pääsyä mihinkään
repon ulkopuolelle. Joka kerta kun putki koskee ulkoiseen järjestelmään — pushaa
imagen Quayhin, julkaisee Helm-chartin tai committaa GitOps-repoon — sen täytyy
tunnistautua. Secretit ovat juuri nämä tunnistautumistiedot.

Secret on salattu arvo, jonka workflow voi lukea mutta jota kukaan ei näe
jälkikäteen käyttöliittymästä. Kaksi näistä on aitoja SSH-avaimia, kaksi on
Quayn käyttäjätunnus ja token.

## 6.2 Secretit

| Secret | Mikä se on | Mihin putki käyttää sitä |
|--------|-----------|--------------------------|
| `IMAGE_REGISTRY_USER` | Quayn robottitilin tunnus | `docker login` ja `helm registry login` Quayhin |
| `IMAGE_REGISTRY_TOKEN` | Saman robottitilin token (salasana, ei avain) | sama kuin yllä |
| `DEPLOY_CONFIG_REPOSITORY_SSH_PRIVATE_KEY` | SSH-avainparin salainen puolisko | `fmidev/openshift-apps-gitops`-repon kloonaus **ja versiopäivityksen push** |
| `HELM_REPOSITORY_PRIVATE_DEPLOY_KEY` | SSH-avaimen salainen puolisko | ks. huomautus 6.5 — tämä ketju ei lue sitä |

| Variable (ei secret) | Arvo | Mihin |
|----------------------|------|-------|
| `IMAGE_REGISTRY` | `quay.io` | Rekisterin osoite. Ei salainen, joten se on variable. Ohjaa myös PR-testejä: ilman sitä `test.yml` ohittaa Docker-buildin hiljaisesti. |

Missä kutakin käytetään julkaisussa:

```
tagi 0.1.0
  |
  +-- Docker build and push -------> Quay      IMAGE_REGISTRY_USER + _TOKEN
  +-- Helm publish to OCI ---------> Quay      IMAGE_REGISTRY_USER + _TOKEN
  +-- Update OpenShift GitOps -----> GitHub    DEPLOY_CONFIG_REPOSITORY_SSH_PRIVATE_KEY
```

## 6.3 Quayn robottitili

Quayssa ei käytetä henkilökohtaisia tunnuksia vaan robottitiliä: se on
konekäyttäjä, jolle annetaan oikeus vain tarvittaviin repositoryihin ja jonka
tokenin voi mitätöidä erikseen.

Tarvittava oikeus on `write` sekä `fmi/smartalert-web`- että
`fmi/smartalert-web-chart`-repositoryyn. Lue-oikeus riittää klusterin
pull secretille, ei tälle.

## 6.4 SSH deploy key GitOps-repoon

Deploy key on avainpari, joka antaa pääsyn **yhteen** repositoryyn — ei koko
tiliin. Julkinen puolisko viedään kohderepoon, salainen puolisko tallennetaan
tänne secretiksi.

```bash
ssh-keygen -t ed25519 -C "smartalert-web deploy" -f smartalert-web-gitops -N ""
```

- `smartalert-web-gitops.pub` → `fmidev/openshift-apps-gitops` → Settings →
  Deploy keys → Add, **Allow write access päälle**. Kirjoitusoikeus on pakollinen,
  koska workflow committaa versiopäivityksen takaisin.
- `smartalert-web-gitops` (ilman `.pub`) → tämän repon secretiksi
  `DEPLOY_CONFIG_REPOSITORY_SSH_PRIVATE_KEY`, sisältö kokonaisuudessaan
  `-----BEGIN`- ja `-----END`-rivit mukaan lukien.
- Poista paikalliset tiedostot sen jälkeen.

Jos avain on jo olemassa organisaatiotasolla muita pak-sovelluksia varten,
uutta ei tarvitse luoda — tarkista ensin.

## 6.5 Huomautus `HELM_REPOSITORY_PRIVATE_DEPLOY_KEY`:sta

`openshift-deploy.yml@0.3.3` esittelee tämän secretin pakollisena, mutta **ei
välitä sitä yhdellekään alityölle**. Sitä lukee vain
`helm-build-and-publish-to-github.yml`, jota tämä ketju ei käytä — meidän
chartimme menee Quayn OCI-rekisteriin, ei GitHubiin.

Käytännössä: jos se on jo organisaatiotasolla, jätä se rauhaan.

Jos sitä ei ole, on kaksi vaihtoehtoa. `deploy.yml` käyttää `secrets: inherit`,
jolloin puuttuvan secretin pitäisi välittyä tyhjänä ilman virhettä — mutta
`required: true` -esittelyä ei ole varmennettu tässä ympäristössä, joten
ensimmäinen ajo näyttää kumpi pätee. Jos ajo kaatuu heti puuttuvaan secretiin,
nopein korjaus on luoda se luvun 6.4 ohjeella (arvoa ei käytetä mihinkään)
tai poistaa `secrets: inherit` ja välittää kolme tarvittavaa secretiä
nimeltä.

## 6.6 Turvallisuushuomioita

- `secrets: inherit` välittää **kaikki** repon ja organisaation secretit
  kutsutulle workflow'lle. Se on hyväksyttävää tässä, koska kutsuttava on saman
  organisaation `fmidev/.github` ja versio on kiinnitetty (`@0.3.3`) — mutta
  version nostossa kannattaa katsoa mitä muuttui.
- Anna robottitilille ja deploy-avaimelle vain tarvittavat oikeudet.
- Deploy-avaimet eivät vanhene itsestään; kierrätä ne osana normaalia
  avaintenhallintaa.
- Älä koskaan committaa avaimia repoon. Secretit näkyvät ajolokeissa
  maskattuina, mutta älä silti tulosta niitä.

# 7. Vaihe 3 — GitOps-repon bootstrap

**Tämä on helpoin vaihe unohtaa, ja ilman sitä julkaisu epäonnistuu.**

Deploy-workflow **päivittää** tiedostoja polussa
`pak/smartalert-web/development/` — se ei luo niitä. Jos hakemistoa ei ole,
workflow kaatuu `cd`-komentoon, kun image ja chart on jo pushattu Quayhin.

Tee PR repoon `fmidev/openshift-apps-gitops` ennen ensimmäistä tagia.

`pak/smartalert-web/development/Chart.yaml`:

```yaml
apiVersion: v2
name: smartalert-web-chart
description: Helm chart for smartalert-web
type: application
dependencies:
  - name: smartalert-web-chart
    version: "0.0.0"
    repository: "oci://quay.io/fmi"
  - name: fmi-routes
    version: "0.0.9"
    repository: "https://fmidev.github.io/helm-charts"
version: 0.0.0
```

`pak/smartalert-web/development/values.yaml`:

```yaml
smartalert-web-chart:
  application:
    deployment:
      image:
        repository: quay.io/fmi/smartalert-web
        tag: 0.0.0
fmi-routes:
  routes:
    smartalert-web-development-default:
      enabled: true
      host: smartalert-web.out.ock.fmi.fi
      targetPort: https
      targetService: smartalert-web
      type: external
      tls:
        termination: edge
        insecureEdgeTerminationPolicy: Allow
```

Huomioita:

- `0.0.0` on alkuarvo; workflow ylikirjoittaa sen jokaisella tagilla.
- `dependencies`-listan **ensimmäisen** alkion on oltava sovelluksen oma chart —
  workflow päivittää `dependencies[0].version`-kentän.
- `values.yaml`:n ylimmän tason avaimen on oltava täsmälleen
  `smartalert-web-chart`.
- Rakenne on kopioitu `pak/yle-weatherproof-fi/development/`-hakemistosta.
  Tarkista `fmi-routes`-versio siitä.

# 8. Vaihe 4 — Verkkolevy

Yksi jaettu NFS-levy, jonka alla on maakohtaiset hakemistot. Levy mountataan
polkuun `/smartmet/www/smartalert/sites`.

Rakenne levyllä:

```
ge/capmap-config.js
ge/data/publishedCap/<vuosi>/<kk>/<aikaleima>/...
ge/img/                   vain oletuksesta poikkeavat ikonit
kg/capmap-config.js
kg/data/...
```

Ikonihakemisto on siis konfiguraatiotiedoston vieressä, ja siihen laitetaan
vain ne kuvat jotka halutaan korvata (luku 3.5). Tiedostonimien on vastattava
jaetun `img/`-hakemiston nimiä.

Datapuu tukee kahta muotoa, jotka tunnistetaan automaattisesti:

```
data/publishedCap/<vuosi>/<kk>/<aikaleima>/<aikaleima>_NNNN_ALERT_*.xml
data/<domain>/publishedCap/<vuosi>/<kk>/<aikaleima>/...
```

jossa `<domain>` on esimerkiksi `meteorology` tai `hydrology`.

**Huomaa:** `lastUpdated.php` lukee eri alipolkua — `data/published`, ei
`data/publishedCap`. Jos levyllä ei ole `published`-hakemistoa, päivitysaika
näkyy tyhjänä vaikka varoitukset toimisivat. Tämä on vanha, tiedossa oleva
epäjohdonmukaisuus.

## 8.1 Levytilan tarve

Nykyisten `smartmet-demo`-sivujen datapuut mitattiin HTTP:n yli 25.8.2026.
Historiaa on helmikuusta 2026 alkaen, eli noin kahdeksan kuukautta.

| Kohde | Määrä |
|-------|-------|
| Maakohtaiset konfiguraatiot ja ikonit | 0,8 MB |
| CAP-data, kaikki 15 maata yhteensä | noin 1,1 GB |
| Suurimmat yksittäiset maat | co, ge, ua — kukin 250–350 MB |
| Kasvu nykyisellä julkaisutahdilla | suuruusluokkaa 100–200 MB/kk |

Yksittäiset CAP-tiedostot ovat odotettua isompia — suurimmat lähes 0,5 MB —
koska varoituspolygonit ovat tarkkoja. Georgian puu mitattiin tarkasti: 79
julkaisua, 968 tiedostoa, 233 MB.

**Suositus: 20 GB.** Se kattaa nykyisen historian noin kahdeksankertaisesti ja
antaa vuosien kasvuvaran. Jos vanhaa dataa siivotaan säännöllisesti, pienempikin
riittää — mutta levytila on halpaa verrattuna siihen että se loppuu kesken.

Luvut ovat arvioita otannasta, paitsi Georgian osalta. Tarkista todelliset koot
lähdejärjestelmästä ennen tilausta, jos tarkkuudella on väliä.

## 8.2 Käyttöoikeudet

Levylle kirjoittaa vain FMI. Maakohtainen eristys tehdään hakemisto-oikeuksilla:
kunkin maan ylläpitäjä näkee ja muokkaa vain oman maansa hakemistoa.

Huomaa että `capmap-config.js` on joka tapauksessa julkisesti luettavissa
selaimelle osoitteessa `/<cc>/capmap-config.js` — sivusto on julkinen. Eristys
koskee siis muokkausoikeutta, ei HTTP-lukua.

## 8.3 Levyn kytkeminen Helmiin

Poista kommentit `conf/helm/values.yaml`:n kohdista ja täytä palvelin ja polku:

```yaml
    volumeMounts:
      smartalert-sites:
        mountPath: /smartmet/www/smartalert/sites
        readOnly: true
    volumes:
      smartalert-sites:
        nfs:
          path: <levyn polku>
          server: <palvelin>.fmi.fi
          readOnly: true
```

Tämä on **ainoa** levyyn liittyvä Helm-muutos. Uudet maat eivät vaadi lisäyksiä.

## 8.4 Ennen kuin levy on olemassa

Sovellus nousee pystyyn ilman levyä: podi menee `Running`-tilaan ja
terveystarkistus menee läpi, koska se ei vaadi mountteja. Etusivu kertoo
tällöin, ettei maita ole vielä löytynyt.

Maasivut eivät kuitenkaan näy ennen levyä, koska konfiguraatiot ovat siellä.
Levy on siis tarpeen jo sivujen näkymiseen, ei vain varoitusdatalle.

# 9. Vaihe 5 — Ensimmäinen julkaisu

Tagin on oltava semver-muotoa `X.Y.Z`.

```bash
cd /polku/smartalert-web
git checkout master
git pull
git tag 0.1.0
git push origin 0.1.0
```

Tagi käynnistää `.github/workflows/deploy.yml`:n:

1. **Setup** — tarkistaa versiomuodon.
2. **Docker build and push** — buildaa juuren `Dockerfile`n ja pushaa imagen
   `quay.io/fmi/smartalert-web:0.1.0`.
3. **Helm publish** — pakkaa `conf/helm`-chartin ja pushaa sen
   osoitteeseen `oci://quay.io/fmi`.
4. **Update OpenShift GitOps** — päivittää version GitOps-repoon.

ArgoCD vie muutoksen klusteriin. **Käsin ajettavia `oc apply` -komentoja ei
ole.**

Kopioi maakonfiguraatiot levylle (luku 4.1):

```bash
rsync -av /polku/repoon/sites/ <levyn mountpoint>/
```

# 10. Vaihe 6 — Varmistus

```bash
oc project <dev-namespace>
oc get pods -l app=smartalert-web
oc get route | grep smartalert-web
```

Selaimessa:

- `https://<route>/` — etusivu, jossa kaikki levyltä löytyneet maat
- `https://<route>/ge/` — Georgian kartta
- `https://<route>/ge/capmap-config.js` — maan config levyltä
- `https://<route>/sites/ge/capmap-config.js` — pitää antaa **403**
- `https://<route>/ge/list.php` — `[]` jos dataa ei vielä ole, ei virhettä

# 11. Arki — yhden maan konfiguraation muuttaminen

**Pieni muutos yhteen maahan on yhden tiedoston muutos levyllä, eikä se vaadi
buildia, tagia eikä julkaisua.**

Esimerkki: Georgian kartan zoom-taso 8 → 9.

```bash
vim <levyn mountpoint>/ge/capmap-config.js     # zoom: 8  ->  zoom: 9
```

Muutos on voimassa heti seuraavalla sivulatauksella. Ei committia, ei pushia,
ei CI-ajoa, ei ArgoCD:tä.

Tämä on olennainen ero aiempaan suunnitelmaan, jossa konfiguraatiot olivat
imagessa ja jokainen muutos vaati uuden tagin.

Yleisimmät muutoskohteet:

| Mitä halutaan | Mitä muokataan levyllä |
|---------------|------------------------|
| Kartan keskitys, rajat, zoom | `<cc>/capmap-config.js` |
| Tapahtumatyypit (`eventTypes`) | `<cc>/capmap-config.js` |
| Kielet ja niiden järjestys | `<cc>/capmap-config.js`, `languages` |
| Oletuskieli, aikavyöhyke, päiväysformaatti | `<cc>/capmap-config.js` |
| Omat ikonit | `<cc>/img/` + `customIcons: true` |
| Omat sijainnit | `<cc>/locations.js` + `customLocations: true` |

Asetukset on dokumentoitu `README.md`:n taulukossa.

Muutos on myös eristetty: maan hakemisto ei ole kytköksissä muihin, joten
GE:n rikkominen ei voi rikkoa Kirgisian sivua.

## 11.1 Milloin tagi silti tarvitaan

Vain kun muutetaan **jaettua** koodia: `js/capmap.js`, `css/`, endpointit,
`site.html`, käännöstiedostot `i18n/` tai oletusikonit `img/`. Ne ovat
imagessa, ja muutos etenee normaalin julkaisuketjun kautta (luku 9).

## 11.2 Muutoksen kokeilu paikallisesti

Baseimage on Quayssa ja se on private, joten pull vaatii oman `docker login
quay.io` -kirjautumisen. Robottitiliä tai GitHub-secrettejä **ei** tarvita —
ne ovat vain pushia varten.

```bash
docker login quay.io
docker build -t smartalert:local .
docker run --rm -p 8080:8080 \
  -v /polku/repoon/sites:/smartmet/www/smartalert/sites:ro \
  smartalert:local
```

Selaimessa `http://localhost:8080/`. Työpuun `sites/`-hakemisto toimii siis
paikallisena peilinä verkkolevystä.

Jos haluat mukaan myös CAP-dataa, mountit menevät maan hakemiston alle:

```bash
  -v /polku/cap/ge:/smartmet/www/smartalert/sites/ge/data:ro
```

Tällöin `sites/ge/data`-hakemiston pitää olla olemassa työpuussa (vaikka
tyhjänä), koska liitoskohtaa ei voi luoda read-only-mountin sisään. Levyllä
tuotannossa tätä ongelmaa ei ole, koska `ge/data` on osa samaa jakoa.

Buildissa tulee ilmoitus `HEALTHCHECK is not supported for OCI image format`,
jos käytät podmania. Se on harmiton: OpenShiftissä valmius- ja
elossaolotarkistukset tulevat Helm-chartista, ei Dockerfilen
`HEALTHCHECK`-rivistä.

# 12. Uuden maan lisääminen

Luo levylle hakemisto ja siihen konfiguraatio:

```bash
mkdir <levyn mountpoint>/xx
cp <levyn mountpoint>/ge/capmap-config.js <levyn mountpoint>/xx/
vim <levyn mountpoint>/xx/capmap-config.js
```

Muokkaa vähintään `languages`, `defaultLanguage`, `center`, `bounds`,
`timeZone` ja `eventTypes`. Käännöstiedostot ovat jo imagen `i18n/`-hakemistossa.

Maa ilmestyy etusivulle ja osoitteeseen `/xx/` heti. **Repoa, Dockerfileä,
Helm-chartia tai terveystarkistusta ei tarvitse muuttaa, eikä uutta imagea
tarvita.**

Kaksi valinnaista lisäystä:

- Näyttönimi etusivulla: lisää `siteName: 'Maan nimi'` konfiguraatioon. Ilman
  sitä käytetään imagen sisäistä nimilistaa ja viime kädessä maakoodia.
- Omat ikonit: `<levyn mountpoint>/xx/img/` ja `customIcons: true`. Riittää
  laittaa ne kuvat jotka eroavat oletuksesta.

Maakoodin on täsmättävä muotoon `xx` tai `xx-yyy` (kaksi kirjainta,
valinnainen väliviivalla erotettu jatke), koska reititys tunnistaa maat siitä.

# 13. Vianetsintä

| Oire | Todennäköinen syy |
|------|-------------------|
| Etusivu sanoo ettei maita löytynyt | Levyä ei ole mountattu, tai maahakemistoista puuttuu `capmap-config.js`. |
| Workflow kaatuu vaiheeseen "Update version in OpenShift GitOps" | GitOps-hakemistoa ei ole luotu (luku 7). Image ja chart ovat jo Quayssa; korjaa hakemisto ja aja sama tagi uudelleen. |
| `ImagePullBackOff` | `fmi-openshift-pull-secret` ei pääse lukemaan repositorya (luku 5). |
| Workflow ei käynnisty | Tagi ei ole muotoa `X.Y.Z`. |
| `denied: requested access to the resource is denied` | Robottitilillä ei ole `write`-oikeutta, tai secretit puuttuvat. |
| `Permission denied (publickey)` GitOps-vaiheessa | `DEPLOY_CONFIG_REPOSITORY_SSH_PRIVATE_KEY` puuttuu tai on väärä. |
| GitOps-vaihe kaatuu pushiin, ei kloonaukseen | Deploy-avaimelta puuttuu **Allow write access** (luku 6.4). |
| Maan sivu 404 tai tyhjä kartta | Maakoodi ei täsmää muotoon `xx` / `xx-yyy`, tai `capmap-config.js` puuttuu levyltä. |
| Kartta latautuu mutta kielivalikko on tyhjä | `languages` puuttuu konfiguraatiosta, tai listattua käännöstiedostoa ei ole `i18n/`-hakemistossa. |
| Kielet väärässä järjestyksessä | `languages`-listan järjestys on valikon järjestys — muuta listaa. |
| `list.php` palauttaa `[]` | Dataa ei ole levyllä, tai hakemistorakenne ei vastaa sopimusta (luku 8). |
| Varoitukset näkyvät, päivitysaika tyhjä | Levyltä puuttuu `published`-hakemisto (luku 8). |
| Laillinen pyyntö saa 403:n | Tarkista ModSecurity kontin lokista ennen sovelluslogiikkaa (luku 14.2). |
| Maan oma ikoni ei näy | Tiedostonimi ei vastaa jaetun `img/`-hakemiston nimeä, tai tiedosto on väärässä paikassa — sen kuuluu olla `<cc>/img/`, ei `<cc>/img/custom/`. Väärin nimetyn tilalla näkyy oletusikoni. |

# 14. Mitä on testattu

Toteutus on ajettu läpi paikallisesti oikeilla konfiguraatioilla ja
read-only-mountilla:

- Etusivu löytää maat mountatusta levystä ajonaikaisesti
- `/ge` ohjautuu `/ge/`-osoitteeseen, jotta sivu-relatiiviset polut toimivat
- Maakohtainen sisältö tulee levyltä, jaettu koodi imagesta
- `/sites/...` antaa 403 — maan hakemistoon ei pääse ohi etuliitteen
- Kielet ladataan konfiguraation `languages`-listasta, ja pudotusvalikon
  järjestys vastaa listaa
- Maakohtainen datan eristys varmistettu kahdella eri datamuodolla
  samanaikaisesti eri maissa
- Datattoman maan `list.php` palauttaa siistin `[]` ilman PHP-varoituksia
- Custom-ikonit: maan oma kuva voittaa oletuksen, ja puuttuva putoaa takaisin
  jaettuun oletukseen — myös maalla jolla ei ole omaa ikonihakemistoa lainkaan
- Ikonikäsittelijä torjuu polkuhyökkäykset ja vastaa 304:llä ehdolliseen
  pyyntöön
- `?dir=`-suodatus toimii maakohtaisesti, polkuhyökkäykset torjutaan
- **Vanha yhden sivuston asennus toimii ennallaan** — savutestit läpi
- PHP-lint puhdas sekä 7.2:lla että 8:lla

## 14.1 Varmistettu oikealla baseimagella

Koko ratkaisu on ajettu läpi myös FMI:n omalla imagella
(`quay.io/fmi/asi-www-baseimage:rocky97-php85-4.1.2`) — **PHP 8.5.6, Apache
2.4.62** — read-only-mountilla ja oikeilla maakonfiguraatioilla:

- Kaikki 15 maasivua vastaavat 200, etusivu listaa ne levyltä
- Terveystarkistus `/node-health-status/` vastaa `OK` (käyttää baseimagen omaa
  `generate-monitor-response.php`:tä)
- Kaikki sivun resurssit latautuvat: config, jaettu JS ja CSS, molemmat
  kielitiedostot, custom-ikoni
- CAP-data luetaan oikein molemmissa muodoissa, `?dir=`-suodatus mukaan lukien
- **Ei yhtään PHP 8.5:n varoitusta, notice- tai deprecated-viestiä**

Aiempi varaus PHP 7.2 → 8.5 -yhteensopivuudesta on siis suljettu.

## 14.2 ModSecurity

Baseimagessa on päällä ModSecurity 2.9.6 ja OWASP CRS 3.3.5. Se ei häirinnyt
mitään laillista liikennettä testeissä, mutta se **torjuu polkuhyökkäysyritykset
jo ennen PHP:tä**: `?dir=../evil` sai vastaukseksi 403 sen sijaan että olisi
edennyt PHP:n sallittujen listalle ja palauttanut tyhjän tuloksen. Suojaus on
siis kaksinkertainen.

Tämä kannattaa muistaa vianetsinnässä: jos jokin laillinen pyyntö saa
odottamattoman 403:n, katso kontin lokista ModSecurityn `audit_data`-merkinnät
ennen kuin epäilet sovelluslogiikkaa.

# 15. Tiedossa olevat avoimet kohdat

- **PHP 7.2 → 8.5.** Suljettu: ajettu läpi baseimagella PHP 8.5.6:lla ilman
  yhtäkään varoitusta (luku 14.1).
- **Käyttöliittymä.** Image rakentuu repon nykyisestä työpuusta, jossa on uusi
  toolbar-käyttöliittymä. Se ei ole vielä `smartmet-demo.fmi.fi`:ssä.
- **Maakohtaiset asetukset** haettiin nykyisistä `smartmet-demo`-sivuista.
  `ua-sea`:n asetukset ovat käytännössä identtiset `ua`:n kanssa — kannattaa
  tarkistaa onko se tarkoitus.
- **Resurssimitoitus** on templaten oletus (1 Gi / 5 Gi), todennäköisesti
  reilusti yläkanttiin.
- **Route-osoite** lyödään lukkoon GitOps-PR:ssä.

# 16. Liite — maat

15 maata, konfiguraatiot valmiina työpuun `sites/`-hakemistossa:

| Koodi | Maa | Kielet (valikon järjestys) | Omia ikoneita |
|-------|-----|----------------------------|---------------|
| az | Azerbaijan | en-AZ, az-AZ, ru-AZ | |
| co | Colombia | en-CO, es-CO | 41 |
| et | Ethiopia | en-ET, om-ET, am-ET | |
| ge | Georgia | ka-GE, en-GE | 20 |
| jm | Jamaica | en-JM | |
| ke | Kenya | ke-KE, en-KE | |
| kg | Kyrgyzstan | ky-KG, ru-KG, en-KG | |
| rw | Rwanda | en-RW, fr-RW, rw-RW | |
| tj | Tajikistan | tg-TJ, ru-TJ, en-TJ | 23 |
| tz | Tanzania | tz-TZ, en-TZ | 22 |
| ua | Ukraine | en-UA, ua-UA | |
| ua-sea | Ukraine (marine) | en-UA, ua-UA | |
| ug | Uganda | lg-UG, en-UG, sw-UG | |
| uz | Uzbekistan | uz-UZ, ru-UZ, en-UZ | |
| vn | Vietnam | en-VN, vi-VN | |

Ikonimäärät ovat oletuksesta poikkeavia tiedostoja. Nykyisiltä sivuilta haettiin
318 tiedostoa, joista 212 osoittautui oletuksen kopioiksi ja karsittiin.
