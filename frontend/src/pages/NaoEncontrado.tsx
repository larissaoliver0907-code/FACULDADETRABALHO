import { Compass } from 'lucide-react'
import { Link } from 'react-router-dom'
import { EstadoVazio } from '../components/ui/Feedback'

export default function NaoEncontrado() {
  return (
    <div className="card">
      <EstadoVazio
        icone={Compass}
        titulo="Página não encontrada"
        descricao="O endereço acessado não existe ou foi removido."
        acao={
          <Link to="/" className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400">
            Voltar ao início
          </Link>
        }
      />
    </div>
  )
}
