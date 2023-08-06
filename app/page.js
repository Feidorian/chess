
import Chess from './Chess';
import HUD, {HUDProvider} from './HUD';



export default function Home() {
  return (
    <main className='flex gap-2'>
      <HUDProvider>
      {/* <Chess /> */}
      {/* <HUD /> */}
     </HUDProvider>
    </main>
  )
}
