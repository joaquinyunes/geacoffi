import Galeria from './components/Galeria'
import Marquee from './components/Marquee'
import Nav from './components/Nav'
import PizarraSeccion from './components/PizarraSeccion'
import Visitanos from './components/Visitanos'
import Carta from './components/Carta'
import { NEGOCIO } from './data/products'
import Sala from './sala/Sala'

export default function App() {
  return (
    <>
      <Nav />
      <main id="top">
        <Sala />
        <Marquee />
        <Carta />
        <Marquee texto="Medialunas tibias" inverso />
        <PizarraSeccion />
        <Galeria />
        <Visitanos />
      </main>
      <footer className="pie">
        <div className="pie-grande" aria-hidden="true">geacofi</div>
        <p>© {NEGOCIO.nombre} · {NEGOCIO.descriptor} · {NEGOCIO.direccion}</p>
      </footer>
    </>
  )
}
