import {
  Bindings,
  getMetadata,
  IActorQueryOperationOutput,
  IActorQueryOperationOutputBindings,
} from '@comunica/bus-query-operation';
import { ActorRdfJoin, IActionRdfJoin } from '@comunica/bus-rdf-join';
import { IActorArgs } from '@comunica/core';
import { IMediatorTypeIterations } from '@comunica/mediatortype-iterations';
import { SymmetricHashJoin } from 'asyncjoin';

/**
 * A comunica Hash RDF Join Actor.
 */
export class ActorRdfJoinSymmetricHash extends ActorRdfJoin {
  public constructor(args: IActorArgs<IActionRdfJoin, IMediatorTypeIterations, IActorQueryOperationOutput>) {
    super(args, 2);
  }

  /**
   * Creates a hash of the given bindings by concatenating the results of the given variables.
   * This function will not sort the variables and expects them to be in the same order for every call.
   * @param {Bindings} bindings
   * @param {string[]} variables
   * @returns {string}
   */
  public static hash(bindings: Bindings, variables: string[]): string {
    return variables.filter(variable => bindings.has(variable)).map(variable => bindings.get(variable).value).join('');
  }

  public async getOutput(action: IActionRdfJoin): Promise<IActorQueryOperationOutputBindings> {
    const variables = ActorRdfJoin.overlappingVariables(action);
    const join = new SymmetricHashJoin<Bindings, string, Bindings>(
      action.entries[0].bindingsStream,
      action.entries[1].bindingsStream,
      entry => ActorRdfJoinSymmetricHash.hash(entry, variables),
      <any> ActorRdfJoin.join,
    );
    return { type: 'bindings', bindingsStream: join, variables: ActorRdfJoin.joinVariables(action) };
  }

  protected async getIterations(action: IActionRdfJoin): Promise<number> {
    // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
    return (await getMetadata(action.entries[0])).totalItems + (await getMetadata(action.entries[1])).totalItems;
  }
}
