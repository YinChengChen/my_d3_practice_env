import { versor } from './versor_function';
export { dragstart };

function dragstart(event, projection){
    v0 = versor.cartesian(projection.invert([event.x, event.y]));
    r0 = projection.rotate();
    q0 = versor(projection.rotate());
}